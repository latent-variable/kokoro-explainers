// Shared plumbing for the bin/ scripts: paths, the video's config, sentence splitting, WAV I/O.
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const HF = join(REPO, "node_modules", ".bin", "hyperframes");
export const VENV_PY = join(REPO, ".venv", "bin", "python");

export function die(msg) {
  console.error(msg);
  process.exit(1);
}

/** The video folder named on the command line, checked. */
export function videoDir(arg) {
  if (!arg) die("name a video folder, e.g. videos/how-it-works");
  const dir = resolve(arg);
  if (!existsSync(join(dir, "video.json"))) die(`${arg} has no video.json`);
  return dir;
}

// Speed is a multiplier on ShipShow's base pace, not Kokoro's own: at speed 1 Kokoro runs at
// BASE_PACE, about BASE_WPM words a minute (measured on the how-it-works video, 2026-10-17).
export const BASE_PACE = 0.85;
export const BASE_WPM = 160;
export const DEFAULT_SPEED = 1.25;

/** A --name value from the command line: `--speed 1.4` or `--speed=1.4`; undefined if absent. */
export function flag(name, argv = process.argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === `--${name}`) return argv[i + 1];
    if (argv[i].startsWith(`--${name}=`)) return argv[i].slice(name.length + 3);
  }
}

const localDir = () => process.env.SHIPSHOW_LOCAL || join(REPO, "local");

/** This person's settings, local/config.json (tailor skill): {speed, voice, theme}. */
export function localConfig() {
  const p = join(localDir(), "config.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}

/** A theme's folder: a client's own in local/themes/ first, then the shared themes/. */
export function themeDir(name) {
  for (const root of [join(localDir(), "themes"), join(REPO, "themes")]) {
    if (existsSync(join(root, name, "theme.css"))) return join(root, name);
  }
  const known = [join(localDir(), "themes"), join(REPO, "themes")].filter(existsSync).flatMap((r) => readdirSync(r));
  die(`no theme "${name}": the themes are ${[...new Set(known)].join(", ")} (skills/theme makes a new one)`);
}

/** A theme's CSS, with its relative url()s pointed at assets/theme/, where its files are
 *  copied (fonts, a logo), so a render needs no network. */
export function themeCss(name, videoFolder) {
  const src = themeDir(name);
  const files = readdirSync(src).filter((f) => f !== "theme.css");
  if (files.length) {
    mkdirSync(join(videoFolder, "assets", "theme"), { recursive: true });
    for (const f of files) cpSync(join(src, f), join(videoFolder, "assets", "theme", f), { recursive: true });
  }
  return readFileSync(join(src, "theme.css"), "utf8").replace(/url\(\s*(["']?)(?!data:|https?:|\/|assets\/)([^"')]+)\1\s*\)/g, (_, q, path) => `url(${q}assets/theme/${path.replace(/^\.\//, "")}${q})`);
}

/** video.json "flair": a video's own motion, over its theme's. */
export const FLAIR = { transition: ["none", "fade", "rise", "slide", "zoom", "wipe"], entrance: null, camera: ["none", "push"], ambient: ["none", "glow", "grid", "dots"], "ambient-strength": null, progress: ["on", "off"] };
export function flairCss(flair = {}) {
  const lines = Object.entries(flair).map(([k, v]) => {
    if (!(k in FLAIR)) die(`video.json flair has "${k}"; it takes ${Object.keys(FLAIR).join(", ")}`);
    if (FLAIR[k] && !FLAIR[k].includes(String(v))) die(`video.json flair ${k} is "${v}"; it takes ${FLAIR[k].join(", ")}`);
    return `  --${k}: ${v};`;
  });
  return lines.length ? `#root {\n${lines.join("\n")}\n}` : "";
}

/** A number from the video's name, so each video's ambient motion is its own but repeatable. */
export function seedFor(name) {
  let h = 2166136261;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** video.json with its defaults filled in. The most specific setting wins: --speed or --theme
 *  on the command line, then video.json, then local/config.json, then the defaults. */
export function config(dir, argv = process.argv) {
  const local = localConfig();
  const cfg = {
    title: basename(dir),
    voice: local.voice || "af_heart",
    speed: local.speed ?? DEFAULT_SPEED,
    theme: local.theme || "shipshow",
    flair: {},
    say: {},           // written form -> what Kokoro is told to say ("HyperFrames": "hyper frames")
    lead: 0.5,         // silence before a scene's first sentence, seconds at speed 1
    gap: 0.35,         // between sentences
    tail: 0.9,         // after a scene's last sentence
    ...JSON.parse(readFileSync(join(dir, "video.json"), "utf8")),
  };
  if (flag("speed", argv) !== undefined) cfg.speed = Number(flag("speed", argv));
  if (flag("theme", argv) !== undefined) cfg.theme = flag("theme", argv);
  if (!(cfg.speed >= 0.5 && cfg.speed <= 2)) die(`speed ${cfg.speed} is outside 0.5 to 2`);
  cfg.kokoroSpeed = Math.round(BASE_PACE * cfg.speed * 1000) / 1000;
  // A video that shows code or captured output gets critic-grounding (skills/critic-grounding): set
  // "shows_code" in video.json, or it is read from scenes.html (a <pre> or <code> element).
  if (cfg.shows_code === undefined) {
    const scenesHtml = join(dir, "scenes.html");
    cfg.shows_code = existsSync(scenesHtml) && /<(pre|code)\b/i.test(readFileSync(scenesHtml, "utf8"));
  }
  return cfg;
}

/** The scenes, in file-name order: [{id, text}]. */
export function scenes(dir) {
  const sdir = join(dir, "script");
  if (!existsSync(sdir)) die(`${dir} has no script/ folder`);
  const files = readdirSync(sdir).filter((f) => f.endsWith(".txt")).sort();
  if (!files.length) die(`${sdir} has no .txt files`);
  return files.map((f) => ({ id: f.replace(/\.txt$/, ""), text: readFileSync(join(sdir, f), "utf8").trim() }));
}

/** A scene's text as sentences. A sentence ends at . ! or ? followed by a space. */
export function sentences(text) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=\S)/).filter(Boolean);
}

/** What Kokoro is told to say for a sentence: video.json "say" applied, whole words only. */
export function spoken(sentence, say) {
  let out = sentence;
  for (const [written, said] of Object.entries(say)) {
    const esc = written.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<![\\w])${esc}(?![\\w])`, "g"), said);
  }
  return out;
}

export const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Run a command, resolve with its stdout, reject with its output on failure. */
export function run(cmd, args, opts = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    let out = "", err = "";
    p.stdout?.on("data", (d) => (out += d));
    p.stderr?.on("data", (d) => (err += d));
    p.on("error", fail);
    p.on("close", (code) => (code === 0 ? ok(out) : fail(new Error(`${basename(cmd)} exited ${code}\n${out.slice(-800)}${err.slice(-800)}`))));
  });
}

/** The environment `hyperframes tts` needs: this repo's venv as its Python, unless one is set. */
export function ttsEnv() {
  return { ...process.env, HYPERFRAMES_PYTHON: process.env.HYPERFRAMES_PYTHON || VENV_PY };
}

/** A 16-bit PCM WAV: {rate, channels, samples: Int16Array}. Kokoro writes 24 kHz mono. */
export function readWav(path) {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") die(`${path} is not a WAV file`);
  let fmt = null;
  for (let o = 12; o + 8 <= b.length; ) {
    const id = b.toString("ascii", o, o + 4), size = b.readUInt32LE(o + 4);
    if (id === "fmt ") {
      fmt = { format: b.readUInt16LE(o + 8), channels: b.readUInt16LE(o + 10), rate: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    } else if (id === "data") {
      if (!fmt || fmt.format !== 1 || fmt.bits !== 16) die(`${path} is not 16-bit PCM`);
      const data = b.subarray(o + 8, o + 8 + size);
      const samples = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
      return { rate: fmt.rate, channels: fmt.channels, samples };
    }
    o += 8 + size + (size % 2);
  }
  die(`${path} has no audio data`);
}

export function writeWav(path, { rate, channels, samples }) {
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0, "ascii");
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8, "ascii");
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * channels * 2, 28);
  h.writeUInt16LE(channels * 2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36, "ascii");
  h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

export const round = (x) => Math.round(x * 100) / 100;

/** A render's file name, from the video's path, so two folders that share a name do not
 *  overwrite each other: videos/how-it-works -> how-it-works, local/videos/a/demo -> local-videos-a-demo. */
export function outName(dir) {
  const rel = relative(REPO, resolve(dir));
  if (rel.startsWith("..")) return basename(dir);
  return rel.replace(/^videos[\\/]/, "").replace(/[\\/]+/g, "-");
}

// The critic loop's dials (skills/critic-loop). A preset sets them all; anything set more
// specifically wins: a flag on bin/critics.mjs, then video.json "review", then the person's
// local/config.json "review", then the preset (a decision video's default is quick).
export const BASE_CRITICS = ["critic-accuracy", "critic-clarity", "critic-pacing", "critic-sync", "critic-visuals", "critic-consistency", "critic-engagement"];
export const TASTE_CRITICS = ["critic-clarity", "critic-visuals", "critic-engagement"];
// The builder judges how much a video matters and records it in video.json "importance"
// (skills/critic-loop, *How much review*); each level picks a preset.
export const IMPORTANCE = { low: "quick", normal: "standard", high: "thorough" };
export const PRESETS = {
  quick: { critics: ["critic-accuracy", "critic-sync", "critic-visuals"], rounds: 1, until: "blocking", model: "sonnet", final: null, frames: "scenes", rerun: "failed" },
  standard: { critics: BASE_CRITICS, rounds: 2, until: "major", model: "sonnet", final: null, frames: "cues", rerun: "failed" },
  thorough: { critics: BASE_CRITICS, rounds: 4, until: "major", model: "sonnet", final: "opus", frames: "cues", rerun: "touched" },
};
const ONE_OF = { until: ["blocking", "major", "minor"], frames: ["cues", "scenes"], rerun: ["failed", "touched", "all"] };
// Wall-clock minutes and thousands of tokens for one critic, and minutes for the packet and a
// rebuild, measured on how-it-works (about 70 s of video), 2026-10-17. Rough by design.
// The slowest critic sets a round's time: Sonnet 10 to 50 s, Opus 45 to 145 s; Haiku not yet measured.
const CRITIC_COST = { haiku: { min: 0.5, k: 50 }, sonnet: { min: 0.8, k: 65 }, opus: { min: 2.0, k: 110 } };
const PACKET_MIN = { cues: 0.15, scenes: 0.1 }, REBUILD_MIN = 0.3;

function dial(key, value) {
  if (key === "rounds") {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 10) die(`review rounds is ${value}; it takes 1 to 10`);
    return n;
  }
  if (key === "critics") {
    const list = Array.isArray(value) ? value : String(value).split(",").map((s) => s.trim()).filter(Boolean);
    const unknown = list.filter((c) => !existsSync(join(REPO, "skills", c, "SKILL.md")) && !existsSync(join(localDir(), "skills", c, "SKILL.md")));
    if (unknown.length) die(`review critics has ${unknown.join(", ")}, which no skill in skills/ or local/skills/ defines`);
    return list;
  }
  if (key === "final") return value === "none" || value === null ? null : String(value);
  if (ONE_OF[key] && !ONE_OF[key].includes(String(value))) die(`review ${key} is "${value}"; it takes ${ONE_OF[key].join(", ")}`);
  return String(value);
}

export function reviewPlan(cfg, argv = process.argv) {
  const kind = cfg.kind || "feature";
  if (!["decision", "feature", "release"].includes(kind)) die(`video.json kind is "${kind}"; it takes decision, feature, release`);
  if (cfg.critics) die(`video.json "critics" moved into "review": {"critics": [...]} (skills/critic-loop)`);
  const cli = {};
  for (const k of ["preset", "rounds", "until", "model", "final", "frames", "rerun", "critics"]) if (flag(k, argv) !== undefined) cli[k] = flag(k, argv);
  if (cfg.importance !== undefined && !IMPORTANCE[cfg.importance]) die(`video.json importance is "${cfg.importance}"; it takes ${Object.keys(IMPORTANCE).join(", ")}`);
  // The agent's importance stands for a preset at the video's level, so it beats a person's
  // general default, while a preset set on the video or a flag in the moment beats it.
  const videoLayer = { ...(cfg.review || {}) };
  if (!videoLayer.preset && cfg.importance) videoLayer.preset = IMPORTANCE[cfg.importance];
  const layers = [localConfig().review || {}, videoLayer, cli];
  // A preset resets every dial set less specifically than it: a video's "quick" is not undone
  // by a person's "rounds": 4. Dials set at its own level or more specifically still apply.
  const from = layers.map((l) => !!l.preset).lastIndexOf(true);
  const preset = from >= 0 ? layers[from].preset : kind === "decision" ? "quick" : "standard";
  const presetFrom = from === 2 ? "flag" : from === 1 ? (cfg.review?.preset ? "video.json review" : "importance") : from === 0 ? "local/config.json" : `${kind} default`;
  if (!PRESETS[preset]) die(`review preset is "${preset}"; it takes ${Object.keys(PRESETS).join(", ")}`);
  const plan = { ...PRESETS[preset], critics: [...PRESETS[preset].critics] };
  const overrides = [];
  for (const layer of layers.slice(Math.max(0, from))) {
    for (const [k, v] of Object.entries(layer)) {
      if (k === "preset") continue;
      if (!(k in plan)) die(`review has "${k}"; it takes preset, ${Object.keys(plan).join(", ")}`);
      plan[k] = dial(k, v);
      if (!overrides.includes(k)) overrides.push(k);
    }
  }
  // The floor's critics run whatever list was asked for: no dial removes them.
  const floor = ["critic-accuracy", ...(kind === "decision" ? ["critic-decision"] : []), ...(cfg.shows_code ? ["critic-grounding"] : [])];
  const added = floor.filter((c) => !plan.critics.includes(c));
  if (added.length) plan.critics = [...added.filter((c) => c === "critic-accuracy"), ...plan.critics, ...added.filter((c) => c !== "critic-accuracy")];
  const taste = plan.critics.filter((c) => TASTE_CRITICS.includes(c));

  // Critics run in parallel, so a round takes as long as its slowest critic, plus the packet.
  const cost = (model) => CRITIC_COST[model] || CRITIC_COST.sonnet;
  const round = (last) => {
    const models = plan.critics.map((c) => (last && plan.final && taste.includes(c) ? plan.final : plan.model));
    return { min: Math.max(...models.map((m) => cost(m).min)) + PACKET_MIN[plan.frames], k: models.reduce((a, m) => a + cost(m).k, 0) };
  };
  const first = round(plan.rounds === 1), middle = round(false), last = round(true);
  const worst = plan.rounds === 1 ? first : { min: first.min + (plan.rounds - 2) * (middle.min + REBUILD_MIN) + last.min + REBUILD_MIN, k: first.k + (plan.rounds - 2) * middle.k + last.k };
  const r = (x) => Math.round(x * 10) / 10;
  return {
    video: cfg.title, kind, importance: cfg.importance || null, importanceReason: cfg.importance_reason || null, presetFrom, preset, ...plan, taste, floor, overrides, floorAdded: overrides.includes("critics") ? added : [],
    estimate: { firstRound: r(first.min), firstRoundTokens: Math.round(first.k), worst: r(worst.min), worstTokens: Math.round(worst.k) },
  };
}
