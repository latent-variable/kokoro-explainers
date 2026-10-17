// Say what this machine is missing, and the command that fixes each. Installs nothing.
//   node bin/doctor.mjs
// The last check voices one word with Kokoro for real; the first run downloads the model
// (about 340 MB, into ~/.cache/hyperframes/tts).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HF, VENV_PY, ttsEnv } from "./lib.mjs";
import { MAX, MIN, pythonVersion, supportedPython } from "./python.mjs";

let bad = 0;
const check = (name, ok, fix) => {
  console.log(`${ok ? "ok  " : "MISS"}  ${name}${ok ? "" : `\n      fix: ${fix}`}`);
  if (!ok) bad++;
  return ok;
};
const has = (cmd, args = ["-version"]) => spawnSync(cmd, args, { stdio: "ignore" }).status === 0;

check(`Node.js 22 or newer (have ${process.versions.node})`, +process.versions.node.split(".")[0] >= 22, "install Node.js 22+ (https://nodejs.org)");
check("ffmpeg, for rendering", has("ffmpeg"), "brew install ffmpeg   (or your platform's package)");
check("HyperFrames and GSAP", existsSync(HF), "npm install");
const py = process.env.HYPERFRAMES_PYTHON || VENV_PY;
const venv = check(`Python for Kokoro (${py})`, existsSync(py), "npm run setup");
if (venv) {
  const have = pythonVersion(py);
  check(`Python ${MIN.join(".")} to ${MAX.join(".")} for Kokoro (have ${have || "unknown"})`, !!have && supportedPython(have),
    `kokoro-onnx 0.6.1 does not support this Python: install one in range (brew install python@3.12), delete .venv and run npm run setup`);
  const mods = spawnSync(py, ["-c", "import kokoro_onnx, soundfile, espeakng_loader; print(espeakng_loader.get_data_path())"], { encoding: "utf8" });
  if (check("kokoro-onnx and soundfile", mods.status === 0, ".venv/bin/pip install -r requirements.txt")) {
    // espeak-ng keeps its data path in a fixed-size buffer: a long one is cut short and
    // fails as "No such file or directory" on .../phontab.
    const data = mods.stdout.trim();
    check(`espeak data path is short enough (${data.length} characters)`, data.length < 160,
      "make the venv somewhere with a shorter path and set HYPERFRAMES_PYTHON to its python");
  }
}
if (!bad) {
  const wav = join(mkdtempSync(join(tmpdir(), "kx-")), "doctor.wav");
  const r = spawnSync(HF, ["tts", "Ready.", "-o", wav, "--json"], { env: ttsEnv(), encoding: "utf8" });
  check("Kokoro speaks", r.status === 0 && existsSync(wav), (r.stdout || r.stderr || "").trim().slice(-400));
}
console.log(bad ? `\n${bad} thing(s) to fix.` : "\nReady: npm run make -- videos/how-it-works");
process.exit(bad ? 1 : 0);
