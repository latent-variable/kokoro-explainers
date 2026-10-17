// Is a code excerpt shown in a video genuine? Each segment between "…" markers must be
// consecutive lines of the source file (blank lines ignored), in file order, with the same
// relative indentation and the same text inside each line. Every omitted gap is listed, with its
// first lines and a flag where it holds a guard, branch, decorator, early exit or default whose
// absence changes what the excerpt appears to do. The stated line ranges are required: a segment
// that matches in several places is ambiguous until a range says which.
//   node check-excerpt.mjs <source file> <excerpt file> --ranges 4-6,10-12
// Read the source from the pin (`git show <sha>:<path> > /tmp/x`), not from a working tree.
// Marker: a line that is only `…` (U+2026), optionally behind a comment mark. A literal `...`
// line (a Python stub body) is source text, not a marker; pass --ascii-markers to treat it as one.
// Prints JSON { ok, segments, gaps, problems }. Exit 0: every segment matches (read the gaps
// yourself). Exit 1: a segment does not match, or nothing was checked. Exit 2: bad usage or input.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FLAG = /^\s*@|\b(if|elif|else|try|except|catch|finally|return|raise|throw|assert|default|switch|case|guard|unless|abort|exit|continue|break|while|for|with|await|yield|and|or|not)\b|[!=<>]=|[<>]/;
const lines = (t) => t.replace(/^﻿/, "").split(/\r\n|\r|\n/);
const indentOf = (l) => l.match(/^[ \t]*/)[0].replace(/\t/g, "    ").length;
const body = (l) => l.replace(/\s+$/, "").replace(/^[ \t]*/, "");

// Normalise a block of lines: drop blanks, remember original line numbers, indent relative to the
// block's least-indented line, text exact apart from trailing space.
function normBlock(rows) {
  const min = Math.min(...rows.map((r) => indentOf(r.text)));
  return rows.map((r) => `${indentOf(r.text) - min}|${body(r.text)}`);
}

export function parseRanges(s) {
  if (!s) return null;
  return s.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`bad range "${p}": use 4 or 4-7, comma separated`);
    return [Number(m[1]), Number(m[2] ?? m[1])];
  });
}

export function checkExcerpt(sourceText, excerptText, ranges, opts = {}) {
  const mark = opts.asciiMarkers
    ? /^\s*(?:(?:#|\/\/|--|\/\*|\*|<!--)\s*)?(?:…|\.\.\.)\s*(?:\*\/|-->)?\s*$/
    : /^\s*(?:(?:#|\/\/|--|\/\*|\*|<!--)\s*)?…\s*(?:\*\/|-->)?\s*$/;
  const src = lines(sourceText).map((text, i) => ({ text, n: i + 1 })).filter((r) => r.text.trim());
  const all = lines(sourceText);
  const segs = [[]];
  let leading = false, trailing = false, sawMarker = false;
  lines(excerptText).forEach((l) => {
    if (mark.test(l)) { sawMarker = true; segs.push([]); } else if (l.trim()) segs.at(-1).push({ text: l });
  });
  if (sawMarker) { leading = segs[0].length === 0; trailing = segs.at(-1).length === 0; }
  const parts = segs.filter((s) => s.length);
  const problems = [], segments = [], gaps = [];
  if (!parts.length) return { ok: false, segments, gaps, problems: ["empty excerpt: nothing was checked"] };
  if (!ranges) return { ok: false, segments, gaps, problems: ["--ranges is required: state the line ranges the excerpt claims"] };
  if (ranges.length !== parts.length) {
    return { ok: false, segments, gaps, problems: [`${parts.length} segment(s) in the excerpt but ${ranges.length} range(s) stated`] };
  }
  const nsrc = (k, len) => normBlock(src.slice(k, k + len)).join("\n");
  let after = 0; // index into src after the previous segment
  parts.forEach((seg, i) => {
    const want = normBlock(seg).join("\n"), len = seg.length, found = [];
    for (let k = 0; k + len <= src.length; k++) if (nsrc(k, len) === want) found.push(k);
    if (!found.length) {
      problems.push(`segment ${i + 1} is not consecutive lines of the file (a splice, a changed token or indentation, or a missing …): ${body(seg[0].text).slice(0, 70)}`);
      return;
    }
    const range = (k) => [src[k].n, src[k + len - 1].n];
    const stated = ranges[i];
    const fits = found.filter((k) => range(k)[0] === stated[0] && range(k)[1] === stated[1]);
    const where = found.map((k) => range(k).join("-")).join(", ");
    if (!fits.length) {
      problems.push(`segment ${i + 1}: stated range ${stated.join("-")} but the text is at ${where}`);
      return;
    }
    const k = fits.find((x) => x >= after);
    if (k === undefined) { problems.push(`segment ${i + 1} (${stated.join("-")}) is before the previous segment: out of order`); return; }
    const prev = segments.at(-1);
    if (prev) gaps.push(gap(all, prev.to + 1, range(k)[0] - 1));
    segments.push({ from: range(k)[0], to: range(k)[1] });
    after = k + len;
  });
  if (!problems.length) {
    if (leading) gaps.unshift(gap(all, 1, segments[0].from - 1));
    if (trailing) gaps.push(gap(all, segments.at(-1).to + 1, all.length));
  }
  return { ok: problems.length === 0, segments, gaps: gaps.filter((g) => g.to >= g.from), problems };
}

function gap(all, from, to) {
  const text = all.slice(from - 1, to).filter((l) => l.trim());
  const flags = [...new Set(text.flatMap((l) => l.match(new RegExp(FLAG.source, "g")) || []).map((s) => (s.trim() === "@" ? "@decorator" : s.trim())))];
  return { from, to, lines: text.length, flags, note: flags.length ? "holds a guard, branch or early exit: does dropping it change what the excerpt appears to do?" : "no flags: read these lines anyway, the flags are an aid", preview: text.slice(0, 5).map((l) => l.trim().slice(0, 90)) };
}

function main(argv) {
  const args = [], opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ranges") opts.ranges = argv[++i];
    else if (argv[i] === "--ascii-markers") opts.asciiMarkers = true;
    else if (argv[i].startsWith("--")) { console.error(`unknown option ${argv[i]}`); return 2; }
    else args.push(argv[i]);
  }
  if (args.length !== 2 || opts.ranges === undefined) {
    console.error("usage: check-excerpt.mjs <source file> <excerpt file> --ranges 4-6,10-12 [--ascii-markers]");
    return 2;
  }
  let ranges, src, ex;
  try { ranges = parseRanges(opts.ranges); src = readFileSync(args[0], "utf8"); ex = readFileSync(args[1], "utf8"); }
  catch (e) { console.error(`error: ${e.message}`); return 2; }
  const r = checkExcerpt(src, ex, ranges, opts);
  console.log(JSON.stringify(r, null, 2));
  return r.ok ? 0 : 1;
}

let entry = false;
try { entry = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { entry = false; }
if (entry) process.exit(main(process.argv.slice(2)));
