// Say what this machine is missing, and the command that fixes each. Installs nothing.
//   node bin/doctor.mjs
// The last check voices one word with Kokoro for real; the first run downloads the model
// (about 340 MB, into ~/.cache/hyperframes/tts).
//   node bin/doctor.mjs --omnivoice   also checks the optional OmniVoice engine, and voices one
//                                     word with it (downloads its model, about 1.5 GB, on the first run)
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { HF, REPO, VENV_PY, ttsEnv } from "./lib.mjs";

let bad = 0;
const check = (name, ok, fix) => {
  console.log(`${ok ? "ok  " : "MISS"}  ${name}${ok ? "" : `\n      fix: ${fix}`}`);
  if (!ok) bad++;
  return ok;
};
// OmniVoice is optional: its lines only count against the machine when asked for with --omnivoice.
const wantOmni = process.argv.includes("--omnivoice");
const optional = (name, ok, fix) => {
  console.log(`${ok ? "ok  " : wantOmni ? "MISS" : "opt "}  ${name}${ok ? "" : `\n      fix: ${fix}`}`);
  if (!ok && wantOmni) bad++;
  return ok;
};
const has = (cmd, args = ["-version"]) => spawnSync(cmd, args, { stdio: "ignore" }).status === 0;

check(`Node.js 22 or newer (have ${process.versions.node})`, +process.versions.node.split(".")[0] >= 22, "install Node.js 22+ (https://nodejs.org)");
check("ffmpeg, for rendering", has("ffmpeg"), "brew install ffmpeg   (or your platform's package)");
check("HyperFrames and GSAP", existsSync(HF), "npm install");
const py = process.env.HYPERFRAMES_PYTHON || VENV_PY;
const venv = check(`Python for Kokoro (${py})`, existsSync(py), "npm run setup");
if (venv) {
  const mods = spawnSync(py, ["-c", "import kokoro_onnx, soundfile, espeakng_loader; print(espeakng_loader.get_data_path())"], { encoding: "utf8" });
  if (check("kokoro-onnx and soundfile", mods.status === 0, ".venv/bin/pip install -r requirements.txt")) {
    // espeak-ng keeps its data path in a fixed-size buffer: a long one is cut short and
    // fails as "No such file or directory" on .../phontab.
    const data = mods.stdout.trim();
    check(`espeak data path is short enough (${data.length} characters)`, data.length < 160,
      "make the venv somewhere with a shorter path and set HYPERFRAMES_PYTHON to its python");
  }
}
if (venv) {
  const arm = process.platform === "darwin" && process.arch === "arm64";
  const omni = arm && spawnSync(py, ["-c", "import mlx_audio"], { stdio: "ignore" }).status === 0;
  optional("OmniVoice engine, for higher-quality and cloned voices (Apple Silicon)", omni,
    arm ? "npm run setup:omnivoice" : "OmniVoice runs on MLX, which needs a Mac with Apple Silicon; Kokoro works anywhere");
  if (omni && wantOmni) {
    const dir = mkdtempSync(join(tmpdir(), "ov-"));
    const spec = join(dir, "jobs.json"), wav = join(dir, "doctor.wav");
    writeFileSync(spec, JSON.stringify({ speed: 1.25, voice: { name: "caro_davy" }, cache: dir, jobs: [{ text: "Ready.", wav, seed: 1 }] }));
    const r = spawnSync(py, [join(REPO, "bin", "omnivoice.py"), spec], { encoding: "utf8" });
    optional("OmniVoice speaks", r.status === 0 && existsSync(wav), (r.stderr || r.stdout || "").trim().slice(-400));
  }
}
if (!bad) {
  const wav = join(mkdtempSync(join(tmpdir(), "kx-")), "doctor.wav");
  const r = spawnSync(HF, ["tts", "Ready.", "-o", wav, "--json"], { env: ttsEnv(), encoding: "utf8" });
  check("Kokoro speaks", r.status === 0 && existsSync(wav), (r.stdout || r.stderr || "").trim().slice(-400));
}
console.log(bad ? `\n${bad} thing(s) to fix.` : "\nReady: npm run make -- videos/how-it-works");
process.exit(bad ? 1 : 0);
