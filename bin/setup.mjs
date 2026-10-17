// Make .venv with a Python Kokoro supports, and install requirements.txt into it.
//   node bin/setup.mjs        (npm run setup)
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { REPO, die } from "./lib.mjs";
import { MIN, MAX, pickPython } from "./python.mjs";

const found = pickPython();
if (!found) die(`no Python ${MIN.join(".")} to ${MAX.join(".")} found (kokoro-onnx 0.6.1 does not support newer ones). Install one, for example: brew install python@3.12`);
console.log(`using ${found.cmd} (Python ${found.version})`);
for (const [cmd, args] of [[found.cmd, ["-m", "venv", ".venv"]], [join(REPO, ".venv", "bin", "pip"), ["install", "-r", "requirements.txt"]]]) {
  const r = spawnSync(cmd, args, { cwd: REPO, stdio: "inherit" });
  if (r.status !== 0) die(`${cmd} ${args.join(" ")} failed`);
}
