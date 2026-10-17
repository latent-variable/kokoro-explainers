// Is a code excerpt shown in a video genuine? Each segment between "…" markers must be
// consecutive lines of the source file, in file order, and every omitted gap is listed, with
// a flag when it holds a guard, branch, return or default whose absence changes what the
// excerpt appears to do. Only whitespace is normalised.
//   node check-excerpt.mjs <source file> <excerpt file> [--ranges 4-6,10-12]
// Prints JSON: { ok, segments: [{ from, to }], gaps: [{ from, to, flags }], problems }.
// Exit 0 when every segment matches (read the gaps yourself), 1 when one does not.
import { readFileSync } from "node:fs";

const MARK = /^\s*(?:(?:#|\/\/|--|\/\*|\*|<!--)\s*)?(?:…|\.\.\.)\s*(?:\*\/|-->)?\s*$/;
const FLAG = /\b(if|elif|else|try|except|catch|finally|return|raise|throw|assert|default|switch|case|guard|unless)\b|[!=]==?|\bnot\b/;
const norm = (l) => l.trim().replace(/\s+/g, " ");

export function checkExcerpt(sourceText, excerptText, ranges) {
  const src = sourceText.split("\n"), nsrc = src.map(norm);
  const segs = [[]], marks = [];
  for (const line of excerptText.split("\n")) {
    if (MARK.test(line)) { marks.push(segs.length - 1); segs.push([]); } else segs.at(-1).push(line);
  }
  const lead = segs[0].every((l) => !l.trim()) && marks.length > 0;
  const trail = segs.at(-1).every((l) => !l.trim()) && marks.length > 0;
  const body = segs.map((s) => s.filter((l) => l.trim())).filter((s) => s.length);
  const problems = [], segments = [], gaps = [];
  let from = 0;
  body.forEach((seg, i) => {
    const want = seg.map(norm);
    let at = -1;
    for (let k = from; k + want.length <= nsrc.length && at < 0; k++) if (want.every((w, j) => nsrc[k + j] === w)) at = k;
    if (at < 0) {
      const earlier = nsrc.findIndex((_, k) => want.every((w, j) => nsrc[k + j] === w));
      problems.push(earlier >= 0 && earlier < from ? `segment ${i + 1} is in the file but before the previous segment: out of order`
        : `segment ${i + 1} is not consecutive lines of the file${want.length > 1 ? " (a splice, a changed token, or a missing …)" : ""}: ${seg[0].trim().slice(0, 70)}`);
      return;
    }
    const prev = segments.at(-1);
    if (prev) gaps.push(gap(src, prev.to + 1, at));
    segments.push({ from: at + 1, to: at + want.length });
    from = at + want.length;
  });
  if (lead && segments.length) gaps.unshift(gap(src, 1, segments[0].from - 1));
  if (trail && segments.length) gaps.push(gap(src, segments.at(-1).to + 1, src.length));
  if (ranges && !problems.length) {
    const shown = segments.map((s) => `${s.from}-${s.to}`).join(",");
    if (shown !== ranges) problems.push(`the stated line ranges ${ranges} differ from the matched ones ${shown}`);
  }
  return { ok: problems.length === 0, segments, gaps: gaps.filter((g) => g.to >= g.from), problems };
}

function gap(src, from, to) {
  const lines = src.slice(from - 1, to).filter((l) => l.trim());
  return { from, to, lines: lines.length, flags: [...new Set(lines.flatMap((l) => l.match(new RegExp(FLAG, "g")) || []))] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [srcFile, exFile, ...rest] = process.argv.slice(2);
  if (!srcFile || !exFile) { console.error("usage: check-excerpt.mjs <source file> <excerpt file> [--ranges 4-6,10-12]"); process.exit(2); }
  const ri = rest.indexOf("--ranges");
  const r = checkExcerpt(readFileSync(srcFile, "utf8"), readFileSync(exFile, "utf8"), ri >= 0 ? rest[ri + 1] : undefined);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
