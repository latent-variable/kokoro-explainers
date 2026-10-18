// Stop: before the agent says it is done, run the tests if it changed anything they cover. CI runs the same
// `npm test`, and a stale docs count or a broken test is cheaper to hear about now than from a pull request.
// Exits 2 (the agent keeps working) when they fail; stop_hook_active is set on the second try, which lets it stop,
// so a test that cannot be fixed does not loop. SHIPSHOW_TEST_CMD replaces the command; SHIPSHOW_STOP_ALWAYS=1 skips
// the check for changed files.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { deny, input, projectDir } from "./lib.mjs";

const WATCHED = /^.. "?((bin|kit|skills|template|themes|agents|test|docs|examples|\.claude|\.github)\/|(package\.json|package-lock\.json|AGENTS\.md|README\.md|requirements[^/]*\.txt)$)/;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = input();
  if (i.stop_hook_active) process.exit(0);
  const root = projectDir(i);
  if (process.env.SHIPSHOW_STOP_ALWAYS !== "1") {
    const st = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
    if (st.status !== 0 || !st.stdout.split("\n").some((l) => WATCHED.test(l))) process.exit(0);
  }
  const cmd = process.env.SHIPSHOW_TEST_CMD || "npm test";
  const t = spawnSync(cmd, { cwd: root, shell: true, encoding: "utf8", timeout: 170000 });
  if (t.status === 0) process.exit(0);
  const out = `${t.stdout || ""}\n${t.stderr || ""}`;
  const failed = out.split("\n").filter((l) => /^\s*not ok /.test(l) || /error:/.test(l) || /ffmpeg is not installed/.test(l)).slice(0, 8).map((l) => l.trim());
  deny(`\`${cmd}\` failed${t.error ? ` (${t.error.code || t.error.message})` : ""}. ${failed.length ? `Failing: ${failed.join(" | ")}. ` : `Last output: ${out.trim().split("\n").slice(-4).join(" | ")}. `}Fix them, or say plainly which cannot be fixed and why.`);
}
