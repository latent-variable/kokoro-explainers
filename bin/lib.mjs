// Shared plumbing for the bin/ scripts: paths, the video's config, sentence splitting, WAV I/O.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
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

/** video.json with its defaults filled in. */
export function config(dir) {
  const cfg = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
  return {
    title: basename(dir),
    voice: "af_heart",
    speed: 1.0,
    say: {},           // written form -> what Kokoro is told to say ("HyperFrames": "hyper frames")
    lead: 0.5,         // silence before a scene's first sentence, seconds
    gap: 0.35,         // between sentences
    tail: 0.9,         // after a scene's last sentence
    ...cfg,
  };
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
