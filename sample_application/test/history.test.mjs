import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hasGit = spawnSync("git", ["--version"]).status === 0;

test("the history in history/ replays to exactly the files in this folder", { skip: !hasGit && "git is not installed" }, () => {
  const run = spawnSync("sh", [join(root, "history", "replay.sh")], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const repo = run.stdout.trim();
  const git = (...args) => spawnSync("git", args, { cwd: repo, encoding: "utf8" }).stdout.trim();
  const files = git("ls-files").split("\n");
  assert.ok(files.length >= 14, "the replay produced too few files");
  for (const f of files) assert.equal(readFileSync(join(repo, f), "utf8"), readFileSync(join(root, f), "utf8"), `${f} differs from the replayed history`);
  assert.deepEqual(git("log", "--reverse", "--format=%an").split("\n"), ["agent-base", "agent-pacing", "agent-throughput", "agent-currency", "reviewer"]);
});
