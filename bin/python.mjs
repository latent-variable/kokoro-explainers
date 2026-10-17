// Which Python can run Kokoro. The pinned kokoro-onnx (requirements.txt) needs Python 3.10 to 3.13:
// pip refuses it on 3.14 ("Requires-Python >=3.10,<3.14").
import { spawnSync } from "node:child_process";

export const MIN = [3, 10], MAX = [3, 13];
export const supportedPython = (v) => {
  const m = String(v).match(/^(\d+)\.(\d+)/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (a > MIN[0] || (a === MIN[0] && b >= MIN[1])) && (a < MAX[0] || (a === MAX[0] && b <= MAX[1]));
};

/** "3.12" for a python command, or null if it does not run. */
export function pythonVersion(cmd) {
  if (!cmd || typeof cmd !== "string") return null;
  const r = spawnSync(cmd, ["-c", "import sys; print('%d.%d' % sys.version_info[:2])"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** The first candidate that runs and is supported, as { cmd, version }, else null. `versionOf` is injectable for tests. */
export function pickPython(candidates = ["python3.13", "python3.12", "python3.11", "python3.10", "python3"], versionOf = pythonVersion) {
  for (const cmd of candidates) {
    const version = versionOf(cmd);
    if (version && supportedPython(version)) return { cmd, version };
  }
  return null;
}
