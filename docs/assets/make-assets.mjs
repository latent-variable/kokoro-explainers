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
// Sizes are for the README, which shows this 1280-wide image at about 880: nothing under 20.
function hero() {
  const W = 1280, H = 520;
  const X = 744, CW = 476;   // the decision card
  const opt = (y, letter, name, time, rec) => `
    <g transform="translate(${X + 22} ${y})">
      <rect width="${CW - 44}" height="62" rx="12" fill="${rec ? "#0c2418" : "url(#panel)"}" stroke="${rec ? C.green : C.line}" stroke-width="${rec ? 2.5 : 1.5}"/>
      <text x="20" y="41" class="sg" font-size="28" font-weight="700" fill="${rec ? C.green : C.ember}">${letter}</text>
      <text x="52" y="41" class="sg" font-size="26" font-weight="700" letter-spacing="-.5" fill="${C.ink}">${esc(name)}</text>
      <text x="${CW - 64}" y="40" class="jb" font-size="21" text-anchor="end" fill="${C.ice}">${esc(time)}</text>
    </g>`;
  const body = `
  ${tag(72, 118, "turn a shit show into a ship show", 22)}
  <text x="64" y="252" class="sg" font-size="122" font-weight="700" letter-spacing="-6" fill="url(#brand)">SHIPSHOW</text>
  <text x="72" y="314" class="sg" font-size="30" font-weight="500" fill="${C.muted}">Narrated videos of what your</text>
  <text x="72" y="354" class="sg" font-size="30" font-weight="500" fill="${C.muted}">agents did, and the calls they</text>
  <text x="72" y="394" class="sg" font-size="30" font-weight="500" fill="${C.muted}">need from you.</text>

  ${hud(X - 14, 40, CW + 28, 392)}
  <rect x="${X}" y="54" width="${CW}" height="364" rx="16" fill="url(#panel)" stroke="${C.ice}" stroke-opacity=".35" stroke-width="1.5"/>
  <circle cx="${X + 28}" cy="92" r="7" fill="${C.green}"/><circle cx="${X + 28}" cy="92" r="13" fill="${C.green}" opacity=".25"/>
  ${tag(X + 46, 99, "decision video · 1:41", 20)}
  <text x="${X + 22}" y="150" class="sg" font-size="34" font-weight="700" letter-spacing="-1" fill="${C.ink}">CLOSE THE INVOICE LEAK?</text>
  ${opt(174, "A", "ROUTES OFF", "minutes", false)}
  ${opt(248, "B", "OWNERSHIP CHECK", "~1 hour", true)}
  ${opt(322, "C", "ROW-LEVEL SECURITY", "days", false)}
  <g transform="translate(${X + CW - 196} 230) rotate(-4)"><rect width="184" height="36" rx="8" fill="${C.bg}" stroke="${C.green}" stroke-width="2.5"/><text x="92" y="25" class="jb" font-size="20" font-weight="700" letter-spacing="1.5" text-anchor="middle" fill="${C.green}">✓ RECOMMENDED</text></g>
  <rect x="${X + 22}" y="400" width="${CW - 44}" height="6" rx="3" fill="${C.ice}" opacity=".15"/>
  <rect x="${X + 22}" y="400" width="${(CW - 44) * 0.7}" height="6" rx="3" fill="url(#brand)"/>

  <rect x="${X}" y="446" width="${CW}" height="52" rx="10" fill="${C.bg}" fill-opacity=".88"/>
  <text x="${X + CW / 2}" y="481" class="sg" font-size="27" font-weight="700" text-anchor="middle" fill="${C.ink}">the agent recommends <tspan fill="${C.peach}">option B</tspan></text>`;
  return page(W, H, "ShipShow", "ShipShow: turn a shit show into a ship show. Narrated videos of what your agents did, and the calls they need from you. Beside the name, a 1:41 decision video as ShipShow makes it, asking: close the invoice leak? Three options: routes off, in minutes; an ownership check, in about an hour, recommended; and row-level security, in days. A caption reads: the agent recommends option B.", body);
}

// ---- how it works: five steps, the loop back, and the MP4 ----
function howItWorks() {
  const W = 1280, H = 470;
  const steps = [
    ["01", "ASK", ["a question, or", "a call your", "agent needs"]],
    ["02", "SCRIPT + SCENES", ["a fresh agent", "writes them", "from the code"]],
    ["03", "VOICE", ["Kokoro or", "OmniVoice, on", "your machine"]],
    ["04", "RENDER", ["HyperFrames", "shows each thing", "on its word"]],
    ["05", "CRITICS", ["fresh agents", "judge it until", "it passes"]],
  ];
  const gap = 38, x0 = 36, cw = (W - 2 * x0 - 4 * gap) / 5, y0 = 96, ch = 206;
  const cx = (i) => x0 + i * (cw + gap);
  const arrow = (x1, x2, y) => `<path d="M${x1} ${y}H${x2 - 2}" stroke="${C.ice}" stroke-width="3" stroke-linecap="round"/><path d="M${x2 - 11} ${y - 8}L${x2 - 1} ${y}L${x2 - 11} ${y + 8}" fill="none" stroke="${C.ice}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const cards = steps.map(([n, title, lines], i) => `
  <g transform="translate(${cx(i)} ${y0})">
    <rect width="${cw}" height="${ch}" rx="14" fill="url(#panel)" stroke="${i === 4 ? C.green : C.line}" stroke-width="1.5"/>
    <text x="20" y="40" class="jb" font-size="20" font-weight="700" fill="${C.ember}">${n}</text>
    <text x="20" y="82" class="sg" font-size="${title.length > 10 ? 23 : 30}" font-weight="700" letter-spacing="-.6" fill="${C.ink}">${esc(title)}</text>
    ${lines.map((l, k) => `<text x="20" y="${122 + k * 27}" class="sg" font-size="21" font-weight="500" fill="${C.muted}">${esc(l)}</text>`).join("")}
  </g>${i < 4 ? arrow(cx(i) + cw + 6, cx(i + 1) - 6, y0 + ch / 2) : ""}`).join("");
  const bottom = y0 + ch, mid = cx(4) + cw / 2, pillW = 150, pillX = mid - pillW / 2, pillY = bottom + 38;
  const loopFrom = cx(4) + 18, loopTo = cx(1) + cw / 2, loopY = bottom + 64;
  const body = `
  ${tag(36, 62, "how it works", 22)}
  ${cards}
  <path d="M${loopFrom} ${bottom + 6}V${loopY}H${loopTo}V${bottom + 12}" fill="none" stroke="${C.ember}" stroke-width="2.5" stroke-dasharray="7 7"/>
  <path d="M${loopTo - 9} ${bottom + 24}l9 -12l9 12" fill="none" stroke="${C.ember}" stroke-width="2.5"/>
  <text x="${(loopFrom + loopTo) / 2}" y="${loopY + 38}" class="jb" font-size="21" letter-spacing="2" text-anchor="middle" fill="${C.ember}">FIX AND JUDGE AGAIN</text>
  <path d="M${mid} ${bottom + 6}V${pillY - 4}" stroke="${C.ice}" stroke-width="3" stroke-linecap="round"/>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="60" rx="12" fill="${C.ember}" opacity=".45" filter="url(#glow)"/>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="60" rx="12" fill="url(#btn)"/>
  <text x="${mid}" y="${pillY + 40}" class="sg" font-size="28" font-weight="700" text-anchor="middle" fill="#1b0d05">▶ MP4</text>
  <text x="${mid}" y="${pillY + 96}" class="sg" font-size="21" font-weight="500" text-anchor="middle" fill="${C.muted}">you watch, then decide</text>`;
  return page(W, H, "How it works", "Five steps. Ask: a question, or a call your agent needs. Script and scenes: a fresh agent writes them from the code. Voice: Kokoro or OmniVoice, on your machine. Render: HyperFrames shows each thing on its word. Critics: fresh agents judge it until it passes; a failing round loops back to the script and scenes to be fixed and judged again. Then an MP4 you watch before you decide.", body, { horizon: false });
}

// ---- the critics ----
function critics() {
  const W = 1280, H = 666;
  const list = [
    ["Accuracy", "Is every claim true?"], ["Clarity", "Will they follow it?"], ["Pacing", "Can they keep up?"],
    ["Sync", "Is it shown when it’s said?"], ["Visuals", "Is every frame readable?"], ["Consistency", "One name for one thing?"],
    ["Engagement", "Would they keep watching?"], ["Decision", "Can they make the call?"], ["Grounding", "Is the evidence real?"],
  ];
  const cw = 386, chh = 128, gx = 21, gy = 18, x0 = 40, y0 = 196;
  const cards = list.map(([name, q], i) => {
    const x = x0 + (i % 3) * (cw + gx), y = y0 + Math.floor(i / 3) * (chh + gy);
    return `
  <g transform="translate(${x} ${y})">
    <rect width="${cw}" height="${chh}" rx="14" fill="url(#panel)" stroke="${C.line}" stroke-width="1.5"/>
    <text x="24" y="50" class="sg" font-size="27" font-weight="700" letter-spacing="-.6" fill="${C.ink}">${esc(name.toUpperCase())}</text>
    <text x="24" y="96" class="sg" font-size="25" font-weight="500" fill="#d6e0ee">${esc(q)}</text>
    <text x="${cw - 24}" y="48" class="jb" font-size="20" font-weight="700" text-anchor="end" fill="${C.ember}">${String(i + 1).padStart(2, "0")}</text>
  </g>`;
  }).join("");
  const body = `
  ${tag(40, 66, "the critics", 22)}
  <text x="40" y="118" class="sg" font-size="36" font-weight="700" letter-spacing="-1" fill="${C.ink}">FRESH AGENTS, ONE QUESTION EACH.</text>
  <text x="40" y="160" class="sg" font-size="26" font-weight="500" fill="#d6e0ee">The agent that made the video never judges it.</text>
  ${cards}`;
  return page(W, H, "The critics", "Nine critics, each a fresh agent with one question: Accuracy, is every claim true? Clarity, will they follow it? Pacing, can they keep up? Sync, is it shown when it is said? Visuals, is every frame readable? Consistency, one name for one thing? Engagement, would they keep watching? Decision, can they make the call? Grounding, is the evidence real? The agent that made the video never judges it.", body, { horizon: false });
}

for (const [name, svg] of [["hero.svg", hero()], ["how-it-works.svg", howItWorks()], ["critics.svg", critics()]]) {
  writeFileSync(join(HERE, name), svg);
  console.log(`${name}: ${(svg.length / 1024).toFixed(0)} KB`);
}
