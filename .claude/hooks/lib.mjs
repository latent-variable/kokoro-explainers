// Shared by the project hooks (.claude/settings.json). A hook reads one JSON object on stdin and says no by
// exiting 2 with the reason on stderr, which Claude Code hands back to the model; any other exit lets the call go.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function input() {
  try { return JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { return {}; }
}
export function projectDir(i) { return resolve(process.env.CLAUDE_PROJECT_DIR || i.cwd || process.cwd()); }
export function deny(reason) { process.stderr.write(`${reason}\n`); process.exit(2); }
