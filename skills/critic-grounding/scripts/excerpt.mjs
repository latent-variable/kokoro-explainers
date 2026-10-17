// The logic of the excerpt check, importable and testable. The command line is check-excerpt.mjs.
//
// An excerpt is genuine when each segment between marker lines is consecutive lines of the source
// (blank lines ignored), in file order, with the same text and the same indentation relative to the
// segment's first line, at the stated line ranges; and the segments sit at the same relative depth to
// one another as in the source. Every omitted gap is listed with a preview and flagged when it holds a
// guard, branch, decorator, early exit or default whose absence changes what the excerpt appears to do.
// Not checked: absolute indentation, tabs against spaces (tabs count as four spaces), and an unmarked
// cut at the start or end of the excerpt; the stated range and the frame show those.
export const MAX_EXCERPT_LINES = 5000;
const FLAG = /^\s*@|\b(if|elif|else|try|except|catch|finally|return|raise|throw|assert|default|switch|case|guard|unless|abort|exit|continue|break|while|for|with|await|yield|and|or|not)\b|[!=<>]=|[<>]/;
const lines = (t) => t.replace(/^﻿/, "").split(/\r\n|\r|\n/);
const indentOf = (l) => l.match(/^[ \t]*/)[0].replace(/\t/g, "    ").length;
const body = (l) => l.replace(/\s+$/, "").replace(/^[ \t]*/, "");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function parseRanges(s) {
  if (!s) return null;
  return s.split(",").map((p) => p.trim()).map((p) => {
    if (!p) throw new Error("bad range: an empty entry (a trailing or doubled comma)");
    const m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`bad range "${p}": use 4 or 4-7, comma separated`);
    return [Number(m[1]), Number(m[2] ?? m[1])];
  });
}

/** The marker is a line holding only `…` (or a custom text), optionally behind a comment mark. */
export function markerPattern({ marker = "…", asciiMarkers = false } = {}) {
  const core = asciiMarkers ? `(?:${esc(marker)}|\\.\\.\\.)` : esc(marker);
  return new RegExp(`^\\s*(?:(?:#|//|--|/\\*|\\*|<!--)\\s*)?${core}\\s*(?:\\*/|-->)?\\s*$`);
}

export function checkExcerpt(sourceText, excerptText, ranges, opts = {}) {
  const mark = markerPattern(opts);
  const all = lines(sourceText);
  const src = [];
  all.forEach((text, i) => { if (text.trim()) src.push({ n: i + 1, indent: indentOf(text), body: body(text) }); });
  const warnings = [];
  const markerLike = src.filter((r) => mark.test(all[r.n - 1])).map((r) => r.n);
  if (markerLike.length) warnings.push(`the source has marker-shaped line(s) at ${markerLike.slice(0, 5).join(", ")}: an excerpt that shows one needs a different marker (--marker "<text>")`);

  const segs = [[]];
  let sawMarker = false;
  for (const l of lines(excerptText)) {
    if (mark.test(l)) { sawMarker = true; segs.push([]); } else if (l.trim()) segs.at(-1).push({ indent: indentOf(l), body: body(l) });
  }
  const leading = sawMarker && segs[0].length === 0;
  const trailing = sawMarker && segs.at(-1).length === 0;
  const parts = segs.filter((s) => s.length);
  const problems = [], segments = [], gaps = [];
  const fail = (...p) => ({ ok: false, segments, gaps, problems: p, warnings });
  if (!parts.length) return fail("empty excerpt: nothing was checked");
  if (!ranges) return fail("--ranges is required: state the line ranges the excerpt claims");
  if (ranges.length !== parts.length) return fail(`${parts.length} segment(s) in the excerpt but ${ranges.length} range(s) stated`);
  if (parts.some((s) => s.length > MAX_EXCERPT_LINES)) return fail(`a segment has more than ${MAX_EXCERPT_LINES} lines: check it in smaller pieces`);

  let after = 0;        // index into src after the previous segment
  let firstIndent = null; // absolute source indent of segment 1's first line, and the excerpt's
  let excerptFirst = null;
  parts.forEach((seg, i) => {
    const len = seg.length, found = [];
    for (let k = 0; k + len <= src.length; k++) {
      if (src[k].body !== seg[0].body) continue;
      let ok = true;
      for (let j = 1; j < len && ok; j++) ok = src[k + j].body === seg[j].body && src[k + j].indent - src[k].indent === seg[j].indent - seg[0].indent;
      if (ok) found.push(k);
    }
    if (!found.length) {
      problems.push(`segment ${i + 1} is not consecutive lines of the file (a splice, a changed token or indentation, or a missing marker): ${seg[0].body.slice(0, 70)}`);
      return;
    }
    const range = (k) => [src[k].n, src[k + len - 1].n];
    const stated = ranges[i];
    const fits = found.filter((k) => range(k)[0] === stated[0] && range(k)[1] === stated[1]);
    if (!fits.length) {
      problems.push(`segment ${i + 1}: stated range ${stated.join("-")} but the text is at ${found.map((k) => range(k).join("-")).join(", ")}`);
      return;
    }
    const k = fits.find((x) => x >= after);
    if (k === undefined) { problems.push(`segment ${i + 1} (${stated.join("-")}) is before the previous segment: out of order`); return; }
    // nesting across markers: the excerpt must show this segment at the same depth, relative to the first, as the source
    if (firstIndent === null) { firstIndent = src[k].indent; excerptFirst = seg[0].indent; }
    else if (src[k].indent - firstIndent !== seg[0].indent - excerptFirst) {
      problems.push(`segment ${i + 1} is shown ${seg[0].indent - excerptFirst >= 0 ? "" : "less "}indented differently from the source relative to segment 1 (source depth change ${src[k].indent - firstIndent}, shown ${seg[0].indent - excerptFirst}): a statement shown inside a block it is not in, or the reverse`);
      return;
    }
    const prev = segments.at(-1);
    if (prev) gaps.push(gap(all, prev.to + 1, range(k)[0] - 1));
    segments.push({ from: range(k)[0], to: range(k)[1] });
    after = k + len;
  });
  if (!problems.length) {
    if (leading) gaps.unshift(gap(all, 1, segments[0].from - 1));
    if (trailing) gaps.push(gap(all, segments.at(-1).to + 1, all.length));
  }
  return { ok: problems.length === 0, segments, gaps: gaps.filter((g) => g.to >= g.from), problems, warnings };
}

function gap(all, from, to) {
  const text = all.slice(from - 1, to).filter((l) => l.trim());
  const flags = [...new Set(text.flatMap((l) => l.match(new RegExp(FLAG.source, "g")) || []).map((s) => (s.trim() === "@" ? "@decorator" : s.trim())))];
  return { from, to, lines: text.length, flags, note: flags.length ? "holds a guard, branch or early exit: does dropping it change what the excerpt appears to do?" : "no flags: read these lines anyway, the flags are an aid", preview: text.slice(0, 5).map((l) => l.trim().slice(0, 90)) };
}
