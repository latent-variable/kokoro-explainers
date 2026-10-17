// Pull every shown code block out of a video's scenes.html, as the exact text a viewer sees, ready for check-excerpt.
//   node extract-excerpts.mjs <scenes.html> <output dir>
// A shown code block is any element with class `ss-code` (the kit's block). Give it `data-source="src/ledger.mjs"`
// and `data-ranges="4-6,19-22"` so that the command to check it is printed; the file name and line numbers on
// screen come from those attributes through CSS (`::before { content: attr(data-source) }`), not from text inside
// the block, so that what is extracted is only code. Tags (syntax highlighting spans) are dropped and entities
// decoded; whitespace and line breaks are kept.
// Writes <output dir>/excerpt-<n>.txt and prints a JSON list: { n, scene, source, ranges, file, lines }.
// Exit 0 with at least one block; exit 1 if the file has none (a video that shows no code); exit 2 on bad usage.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ENTITIES = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&rarr;": "->" };
const decode = (s) => s.replace(/&(?:lt|gt|amp|quot|apos|nbsp|rarr|#39);/g, (m) => ENTITIES[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1] || "";

export function extractExcerpts(html) {
  const out = [];
  const open = /<(\w+)\b[^>]*\bclass="[^"]*\bss-code\b[^"]*"[^>]*>/g;
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1];
    // the element's inner HTML: balance nested tags of the same name
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "g");
    re.lastIndex = m.index;
    let depth = 0, end = null, x;
    while ((x = re.exec(html))) {
      depth += x[1] ? -1 : 1;
      if (!depth) { end = x.index; break; }
    }
    const inner = html.slice(m.index + m[0].length, end ?? html.length);
    const text = decode(inner.replace(/<[^>]+>/g, "")).replace(/^\n/, "");
    const scenes = [...html.slice(0, m.index).matchAll(/data-scene="([^"]*)"/g)];
    out.push({ scene: scenes.length ? scenes.at(-1)[1] : "", source: attr(m[0], "data-source"), ranges: attr(m[0], "data-ranges"), text });
  }
  return out;
}

function main(argv) {
  if (argv.length !== 2) { console.error("usage: extract-excerpts.mjs <scenes.html> <output dir>"); return 2; }
  let html;
  try { html = readFileSync(argv[0], "utf8"); } catch (e) { console.error(`error: ${e.message}`); return 2; }
  const blocks = extractExcerpts(html);
  mkdirSync(argv[1], { recursive: true });
  const list = blocks.map((b, i) => {
    const file = resolve(join(argv[1], `excerpt-${i + 1}.txt`));
    writeFileSync(file, b.text);
    return { n: i + 1, scene: b.scene, source: b.source, ranges: b.ranges, file, lines: b.text.split("\n").length, check: b.source && b.ranges ? `git show <pin>:${b.source} > <tmp>; node check-excerpt.mjs <tmp> ${file} --ranges ${b.ranges}` : "set data-source and data-ranges to get a check command" };
  });
  console.log(JSON.stringify(list, null, 2));
  return list.length ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
