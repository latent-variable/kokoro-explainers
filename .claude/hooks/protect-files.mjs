// PreToolUse on Edit, Write, MultiEdit and NotebookEdit: some files are evidence or the demo itself.
//   sample_application/src/   the two bugs are the point (SHIPSHOW_EDIT_SAMPLE=1 to change them on purpose)
//   videos/*/review/*.txt, videos/*/results/captures/   recorded runs; each has a SHA-256 beside it
//   package-lock.json         npm writes it, not an agent
import { fileURLToPath } from "node:url";
import { isAbsolute, relative, resolve } from "node:path";
import { deny, input, projectDir } from "./lib.mjs";

export function reason(rel, env = process.env) {
  if (/^sample_application\/src\//.test(rel) && env.SHIPSHOW_EDIT_SAMPLE !== "1") return "sample_application/src holds the demo's bugs on purpose; fix them in a scratch copy, as videos/pacer-dev-journey does (SHIPSHOW_EDIT_SAMPLE=1 to change them deliberately)";
  if (/^videos\/[^/]+\/review\/[^/]+\.(txt|sha256)$/.test(rel) || /^videos\/[^/]+\/results\/captures\//.test(rel)) return "recorded runs are evidence, each with a SHA-256: record a new one with capture.mjs instead of editing";
  if (rel === "package-lock.json") return "package-lock.json is written by npm";
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = input();
  const p = i.tool_input?.file_path || i.tool_input?.notebook_path;
  if (typeof p === "string") {
    const root = projectDir(i);
    const rel = relative(root, isAbsolute(p) ? p : resolve(i.cwd || root, p)).split("\\").join("/");
    const r = reason(rel);
    if (r) deny(`Blocked: ${r}.`);
  }
}
