// The README's diagrams, drawn in the buildday look (themes/buildday): node docs/assets/make-assets.mjs
// Writes hero.svg, how-it-works.svg and critics.svg. Each embeds the fonts it uses, cut down to the
// letters it uses when pyftsubset (fontTools) is installed: an SVG shown as an image cannot load a
// font from anywhere else. demo.gif and themes.jpg are frames of real videos; AGENTS.md says how.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS = join(HERE, "..", "..", "themes", "buildday", "fonts");
const C = { bg: "#050812", ink: "#f4f7fb", muted: "#b9c7dc", ember: "#ff7a3d", peach: "#ffc49e", ice: "#8ec8ff", iris: "#8f86ff", green: "#4ade80", line: "#2a3146" };
const FACES = [
  ["SG", 700, "space-grotesk-latin-700-normal.woff2"],
  ["SG", 500, "space-grotesk-latin-500-normal.woff2"],
  ["JB", 400, "jetbrains-mono-latin-400-normal.woff2"],
  ["JB", 700, "jetbrains-mono-latin-700-normal.woff2"],
];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Each font as a data URL, subset to `text` when pyftsubset is there. */
function fontFaces(text) {
  const tmp = mkdtempSync(join(tmpdir(), "ss-font-"));
  return FACES.map(([family, weight, file], i) => {
    const src = join(FONTS, file), out = join(tmp, `${i}.woff2`);
    const r = spawnSync("pyftsubset", [src, `--text=${text}`, "--flavor=woff2", `--output-file=${out}`], { encoding: "utf8" });
    const data = readFileSync(r.status === 0 ? out : src).toString("base64");
    return `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`;
  }).join("");
}

/** A seeded star field, the same on every run. */
function stars(w, h, n, seed = 7) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, () => `<circle cx="${(rand() * w).toFixed(1)}" cy="${(rand() * h).toFixed(1)}" r="${(0.5 + rand() * 1.3).toFixed(2)}" fill="${C.ink}" opacity="${(0.15 + rand() * 0.55).toFixed(2)}"/>`).join("");
}

/** HUD corner brackets around a box. */
const hud = (x, y, w, h, k = 22) => `<path d="M${x} ${y + k}V${y}H${x + k}M${x + w - k} ${y}H${x + w}V${y + k}M${x + w} ${y + h - k}V${y + h}H${x + w - k}M${x + k} ${y + h}H${x}V${y + h - k}" fill="none" stroke="${C.ice}" stroke-opacity=".55" stroke-width="2"/>`;

/** The page: background, stars, the planet's lit rim, then the content. */
function page(w, h, title, desc, body, { horizon = true } = {}) {
  const text = (title + desc + body).replace(/<[^>]+>/g, " ");
  const planet = horizon ? `
  <g clip-path="url(#frame)">
    <ellipse cx="${w / 2}" cy="${h + 900}" rx="${w * 1.1}" ry="980" fill="url(#rimglow)" opacity=".9"/>
    <ellipse cx="${w / 2}" cy="${h + 900}" rx="${w * 1.1}" ry="980" fill="url(#planet)"/>
    <ellipse cx="${w / 2}" cy="${h + 900}" rx="${w * 1.1}" ry="980" fill="url(#grid)" clip-path="url(#frame)"/>
    <ellipse cx="${w / 2}" cy="${h + 900}" rx="${w * 1.1}" ry="980" fill="none" stroke="${C.ice}" stroke-opacity=".6" stroke-width="2"/>
  </g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<defs>
  <style>${fontFaces(text)}
    .sg{font-family:SG,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
    .jb{font-family:JB,SFMono-Regular,Menlo,Consolas,monospace}
  </style>
  <clipPath id="frame"><rect width="${w}" height="${h}" rx="28"/></clipPath>
  <linearGradient id="brand" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${C.ember}"/><stop offset=".3" stop-color="${C.peach}"/><stop offset=".7" stop-color="${C.ice}"/><stop offset="1" stop-color="${C.iris}"/></linearGradient>
  <linearGradient id="emberText" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${C.ember}"/><stop offset=".75" stop-color="${C.peach}"/><stop offset="1" stop-color="#ffe2cf"/></linearGradient>
  <linearGradient id="panel" x1="0" x2=".35" y1="0" y2="1"><stop offset="0" stop-color="#0e162c" stop-opacity=".96"/><stop offset="1" stop-color="#060914" stop-opacity=".96"/></linearGradient>
  <linearGradient id="btn" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff925f"/><stop offset=".45" stop-color="${C.ember}"/><stop offset="1" stop-color="#e5561d"/></linearGradient>
  <radialGradient id="planet" cx=".5" cy="0" r=".5"><stop offset="0" stop-color="#0d1530"/><stop offset="1" stop-color="${C.bg}"/></radialGradient>
  <radialGradient id="rimglow" cx=".5" cy=".5" r=".5"><stop offset=".9" stop-color="${C.ember}" stop-opacity="0"/><stop offset=".97" stop-color="${C.ember}" stop-opacity=".45"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="${C.ice}" stroke-opacity=".12" stroke-width="1"/></pattern>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<g clip-path="url(#frame)">
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  ${stars(w, h, Math.round((w * h) / 4200))}
</g>${planet}
${body}
</svg>
`;
}

const tag = (x, y, text, size = 18) => `<text x="${x}" y="${y}" class="jb" font-size="${size}" letter-spacing="${(size * 0.18).toFixed(1)}" fill="${C.ice}"><tspan fill="${C.ember}" font-weight="700">//</tspan> ${esc(text.toUpperCase())}</text>`;

// ---- hero: the name, the line, and a decision video as ShipShow makes it ----
function hero() {
  const W = 1280, H = 460;
  const opt = (y, letter, name, time, rec) => `
    <g transform="translate(838 ${y})">
      <rect width="344" height="50" rx="10" fill="${rec ? "#0c2418" : "url(#panel)"}" stroke="${rec ? C.green : C.line}" stroke-width="${rec ? 2 : 1.5}"/>
      <text x="18" y="33" class="sg" font-size="22" font-weight="700" fill="${rec ? C.green : C.ember}">${letter}</text>
      <text x="44" y="33" class="sg" font-size="20" font-weight="700" letter-spacing="-.4" fill="${C.ink}">${esc(name)}</text>
      <text x="326" y="32" class="jb" font-size="15" text-anchor="end" fill="${C.muted}">${esc(time)}</text>
    </g>`;
  const body = `
  ${tag(72, 112, "turn a shit show into a ship show")}
  <text x="64" y="236" class="sg" font-size="128" font-weight="700" letter-spacing="-6" fill="url(#brand)">SHIPSHOW</text>
  <text x="72" y="292" class="sg" font-size="27" font-weight="500" fill="${C.muted}">Narrated videos of what your agents did,</text>
  <text x="72" y="328" class="sg" font-size="27" font-weight="500" fill="${C.muted}">and the calls they need from you.</text>

  ${hud(812, 54, 396, 330)}
  <rect x="824" y="66" width="372" height="306" rx="14" fill="url(#panel)" stroke="${C.ice}" stroke-opacity=".35" stroke-width="1.5"/>
  <circle cx="846" cy="97" r="6" fill="${C.green}"/><circle cx="846" cy="97" r="11" fill="${C.green}" opacity=".25"/>
  ${tag(860, 103, "decision video · 1:41", 14)}
  <text x="842" y="146" class="sg" font-size="26" font-weight="700" letter-spacing="-.8" fill="${C.ink}">CLOSE THE INVOICE LEAK?</text>
  ${opt(166, "A", "ROUTES OFF", "minutes", false)}
  ${opt(226, "B", "OWNERSHIP CHECK", "~1 hour", true)}
  ${opt(286, "C", "ROW-LEVEL SECURITY", "days", false)}
  <g transform="translate(1086 214) rotate(-4)"><rect width="112" height="26" rx="6" fill="${C.bg}" stroke="${C.green}" stroke-width="2"/><text x="56" y="18" class="jb" font-size="12" font-weight="700" letter-spacing="1.2" text-anchor="middle" fill="${C.green}">✓ RECOMMENDED</text></g>
  <rect x="842" y="350" width="336" height="5" rx="2.5" fill="${C.ice}" opacity=".15"/>
  <rect x="842" y="350" width="236" height="5" rx="2.5" fill="url(#brand)"/>

  <rect x="836" y="398" width="348" height="40" rx="9" fill="${C.bg}" fill-opacity=".86"/>
  <text x="1010" y="425" class="sg" font-size="20" font-weight="700" text-anchor="middle" fill="${C.ink}">the agent recommends <tspan fill="${C.peach}">option B</tspan></text>`;
  return page(W, H, "ShipShow", "ShipShow: turn a shit show into a ship show. Narrated videos of what your agents did, and the calls they need from you. Beside the name, a decision video as ShipShow makes it: close the invoice leak, with three options, routes off in minutes, an ownership check in about an hour, recommended, and row-level security in days, and a caption reading: the agent recommends option B.", body);
}

// ---- how it works: five steps, the loop back, and the MP4 ----
function howItWorks() {
  const W = 1280, H = 420;
  const steps = [
    ["01", "ASK", ["a question, or a call", "your agent needs"]],
    ["02", "SCRIPT + SCENES", ["a fresh agent writes", "them from the code"]],
    ["03", "VOICE", ["Kokoro or OmniVoice,", "on your machine"]],
    ["04", "RENDER", ["HyperFrames shows", "each thing on its word"]],
    ["05", "CRITICS", ["fresh agents judge it", "until it passes"]],
  ];
  const cw = 226, gap = 18, x0 = 39, y0 = 100, ch = 160;
  const cx = (i) => x0 + i * (cw + gap);
  const cards = steps.map(([n, title, lines], i) => `
  <g transform="translate(${cx(i)} ${y0})">
    <rect width="${cw}" height="${ch}" rx="14" fill="url(#panel)" stroke="${i === 4 ? C.green : C.line}" stroke-width="1.5"/>
    <text x="20" y="38" class="jb" font-size="16" font-weight="700" fill="${C.ember}">${n}</text>
    <text x="20" y="78" class="sg" font-size="${title.length > 10 ? 23 : 27}" font-weight="700" letter-spacing="-.6" fill="${C.ink}">${esc(title)}</text>
    <text x="20" y="114" class="sg" font-size="16" font-weight="500" fill="${C.muted}">${esc(lines[0])}</text>
    <text x="20" y="137" class="sg" font-size="16" font-weight="500" fill="${C.muted}">${esc(lines[1])}</text>
  </g>${i < 4 ? `<path d="M${cx(i) + cw + 4} ${y0 + ch / 2}h${gap - 8}" stroke="${C.ice}" stroke-width="2.5" stroke-linecap="round"/>` : ""}`).join("");
  const bottom = y0 + ch, loopY = bottom + 46, loopFrom = cx(4) + 50, loopTo = cx(1) + cw / 2;
  const pillX = cx(4) + 92, pillW = cw - 92, pillY = bottom + 28, mid = pillX + pillW / 2;
  const body = `
  ${tag(39, 64, "how it works")}
  ${cards}
  <path d="M${loopFrom} ${bottom + 6}V${loopY}H${loopTo}V${bottom + 10}" fill="none" stroke="${C.ember}" stroke-width="2" stroke-dasharray="6 6"/>
  <path d="M${loopTo - 7} ${bottom + 20}l7 -10l7 10" fill="none" stroke="${C.ember}" stroke-width="2"/>
  <text x="${(loopFrom + loopTo) / 2}" y="${loopY + 32}" class="jb" font-size="16" letter-spacing="2" text-anchor="middle" fill="${C.ember}">FIX AND JUDGE AGAIN</text>
  <path d="M${mid} ${bottom + 6}v${pillY - bottom - 12}" stroke="${C.ice}" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="56" rx="12" fill="${C.ember}" opacity=".45" filter="url(#glow)"/>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="56" rx="12" fill="url(#btn)"/>
  <text x="${mid}" y="${pillY + 37}" class="sg" font-size="25" font-weight="700" text-anchor="middle" fill="#1b0d05">▶ MP4</text>
  <text x="${pillX + pillW}" y="${pillY + 88}" class="sg" font-size="16" font-weight="500" text-anchor="end" fill="${C.muted}">you watch, then decide</text>`;
  return page(W, H, "How it works", "Five steps. Ask: a question, or a call your agent needs. Script and scenes: a fresh agent writes them from the code. Voice: Kokoro or OmniVoice, on your machine. Render: HyperFrames shows each thing on its word. Critics: fresh agents judge it until it passes, and a failing round goes back to be fixed and judged again. Then an MP4 you watch before you decide.", body, { horizon: false });
}

// ---- the critics ----
function critics() {
  const W = 1280, H = 620;
  const list = [
    ["Accuracy", "Is every claim true?"], ["Clarity", "Will they follow it?"], ["Pacing", "Can they keep up?"],
    ["Sync", "Is it shown when it’s said?"], ["Visuals", "Is every frame readable?"], ["Consistency", "One name for one thing?"],
    ["Engagement", "Would they keep watching?"], ["Decision", "Can they make the call?"], ["Grounding", "Is the evidence real?"],
  ];
  const cw = 386, chh = 118, gx = 21, gy = 18, x0 = 40, y0 = 150;
  const cards = list.map(([name, q], i) => {
    const x = x0 + (i % 3) * (cw + gx), y = y0 + Math.floor(i / 3) * (chh + gy);
    return `
  <g transform="translate(${x} ${y})">
    <rect width="${cw}" height="${chh}" rx="14" fill="url(#panel)" stroke="${C.line}" stroke-width="1.5"/>
    <text x="24" y="50" class="sg" font-size="27" font-weight="700" letter-spacing="-.6" fill="${C.ink}">${esc(name.toUpperCase())}</text>
    <text x="24" y="88" class="sg" font-size="20" font-weight="500" fill="${C.muted}">${esc(q)}</text>
    <circle cx="${cw - 40}" cy="44" r="17" fill="#0c2418" stroke="${C.green}" stroke-width="2"/>
    <path d="M${cw - 48} 44l6 6l11 -12" fill="none" stroke="${C.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
  }).join("");
  const body = `
  ${tag(40, 66, "the critics")}
  <text x="40" y="114" class="sg" font-size="30" font-weight="700" letter-spacing="-.8" fill="${C.ink}">FRESH AGENTS, ONE QUESTION EACH.</text>
  <text x="634" y="114" class="sg" font-size="22" font-weight="500" fill="${C.muted}">The agent that made the video never judges it.</text>
  ${cards}`;
  return page(W, H, "The critics", "Nine critics, each a fresh agent with one question: Accuracy, is every claim true? Clarity, will they follow it? Pacing, can they keep up? Sync, is it shown when it is said? Visuals, is every frame readable? Consistency, one name for one thing? Engagement, would they keep watching? Decision, can they make the call? Grounding, is the evidence real? The agent that made the video never judges it.", body, { horizon: false });
}

for (const [name, svg] of [["hero.svg", hero()], ["how-it-works.svg", howItWorks()], ["critics.svg", critics()]]) {
  writeFileSync(join(HERE, name), svg);
  console.log(`${name}: ${(svg.length / 1024).toFixed(0)} KB`);
}
