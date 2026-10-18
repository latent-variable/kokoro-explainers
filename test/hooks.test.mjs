// The project hooks (.claude/settings.json): what they refuse, what they let through, and that the settings name files that exist.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { REPO } from "../bin/lib.mjs";

const hook = (name, payload, env = {}) => spawnSync(process.execPath, [join(REPO, ".claude", "hooks", name)], {
  input: JSON.stringify(payload), encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: REPO, SHIPSHOW_ALLOW_DESTRUCTIVE: "", SHIPSHOW_EDIT_SAMPLE: "", ...env },
});
const bash = (command, env) => hook("guard-bash.mjs", { tool_name: "Bash", tool_input: { command } }, env);
const edit = (file_path, env) => hook("protect-files.mjs", { tool_name: "Edit", tool_input: { file_path }, cwd: REPO }, env);

test("hooks: the Bash guard refuses what deletes or rewrites work, and lets ordinary commands through", () => {
  for (const c of ["rm -rf build", "rm file.txt", "sudo rm -r x", "FOO=1 rm a", "ls && rm a", "echo hi | xargs rm", "bash -c 'rm -rf x'", "echo $(rm a)", "find . -name '*.tmp' -delete", "find . -exec rm {} \\;",
    "git restore .", "git checkout -- file", "git checkout .", "git clean -fd", "git reset --hard HEAD~1", "git branch -D feature", "git stash drop", "git push --force origin x", "git push -f", "git -C repo restore a", "/bin/rm a"]) {
    const r = bash(c);
    assert.equal(r.status, 2, `${c} should be refused`);
    assert.match(r.stderr, /Blocked: .*SHIPSHOW_ALLOW_DESTRUCTIVE/, c);
  }
  for (const c of ["git status", "git checkout -b new-branch", "git checkout main", "git push origin feature", "git push -u origin feature", "git branch -m new", "git stash", "git stash pop", "git rm --cached x",
    "mv a b", "rmdir empty", "npm test", "echo 'rm is a command'", "grep -rn \"git restore\" docs", "git commit -m 'never run git clean'", "node bin/make.mjs videos/x"]) {
    assert.equal(bash(c).status, 0, `${c} should pass`);
  }
  // text is not a command: a quoted heredoc (a PR body full of backticks), single quotes; but an unquoted heredoc or double quotes still run substitutions
  for (const c of ["gh pr create --body-file /dev/stdin <<'EOF'\nrefuses `rm`, `unlink` and git `restore`\nrm -rf notes\nEOF", "cat > f <<'EOF'\n`rm -rf x`\nEOF", "echo '`rm -rf x`'", "echo '$(rm a)'", "git commit -m 'note: `rm` is refused'"]) {
    assert.equal(bash(c).status, 0, `${JSON.stringify(c)} is text and should pass`);
  }
  for (const c of ["cat <<EOF\n$(rm a)\nEOF", "echo \"`rm x`\"", "cat <<'EOF'\nfine\nEOF\nrm after.txt"]) {
    assert.equal(bash(c).status, 2, `${JSON.stringify(c)} runs rm and should be refused`);
  }
  assert.equal(bash("rm -rf build", { SHIPSHOW_ALLOW_DESTRUCTIVE: "1" }).status, 0, "a person can allow it on purpose");
  assert.equal(hook("guard-bash.mjs", { tool_name: "Bash", tool_input: {} }).status, 0, "no command is not an error");
  assert.equal(spawnSync(process.execPath, [join(REPO, ".claude", "hooks", "guard-bash.mjs")], { input: "not json", encoding: "utf8" }).status, 0, "bad input does not block");
});

test("hooks: the file guard protects the demo's bugs, recorded runs and the lockfile, and nothing else", () => {
  for (const f of ["sample_application/src/pacing.mjs", join(REPO, "sample_application/src/ledger.mjs"), "videos/pacer-dev-journey/review/scenario-before.txt", "videos/x/review/a.txt.sha256", "videos/pacer-dev-journey/results/captures/tests-after.txt", "package-lock.json"]) {
    const r = edit(f);
    assert.equal(r.status, 2, `${f} should be refused`);
    assert.match(r.stderr, /^Blocked: /, f);
  }
  for (const f of ["sample_application/README.md", "sample_application/test/pacing.test.mjs", "videos/pacer-dev-journey/sources.md", "videos/pacer-dev-journey/review/packet.md", "docs/PRD.md", "bin/lib.mjs", "package.json", "/tmp/elsewhere/sample_application/src/x.mjs"]) {
    assert.equal(edit(f).status, 0, `${f} should pass`);
  }
  assert.equal(edit("sample_application/src/pacing.mjs", { SHIPSHOW_EDIT_SAMPLE: "1" }).status, 0, "a person can change the sample on purpose");
});

test("hooks: the Stop hook blocks on a failing test run once, never loops, and stays quiet when nothing it covers changed", () => {
  const stop = (payload, env) => hook("stop-tests.mjs", { cwd: REPO, ...payload }, { SHIPSHOW_STOP_ALWAYS: "1", ...env });
  const failing = stop({}, { SHIPSHOW_TEST_CMD: "echo 'not ok 3 - the docs rule holds'; exit 1" });
  assert.equal(failing.status, 2);
  assert.match(failing.stderr, /not ok 3 - the docs rule holds/);
  assert.equal(stop({ stop_hook_active: true }, { SHIPSHOW_TEST_CMD: "exit 1" }).status, 0, "the second stop is allowed");
  assert.equal(stop({}, { SHIPSHOW_TEST_CMD: "exit 0" }).status, 0, "passing tests let it stop");
  const quiet = hook("stop-tests.mjs", { cwd: "/tmp" }, { CLAUDE_PROJECT_DIR: "/tmp", SHIPSHOW_STOP_ALWAYS: "", SHIPSHOW_TEST_CMD: "exit 1" });
  assert.equal(quiet.status, 0, "not a git repository: nothing to check");
});

test("hooks: .claude/settings.json is valid, tracked, and names hook files that exist", () => {
  const s = JSON.parse(readFileSync(join(REPO, ".claude", "settings.json"), "utf8"));
  const commands = Object.values(s.hooks).flat().flatMap((m) => m.hooks.map((h) => h.command));
  assert.equal(commands.length, 3);
  for (const c of commands) {
    const file = c.match(/\$CLAUDE_PROJECT_DIR\/(\.claude\/hooks\/[\w-]+\.mjs)/)?.[1];
    assert.ok(file && existsSync(join(REPO, file)), `${c} names a hook file that does not exist`);
  }
  assert.deepEqual(s.hooks.PreToolUse.map((m) => m.matcher), ["Bash", "Edit|Write|MultiEdit|NotebookEdit"]);
  assert.ok(s.permissions.deny.includes("Read(./local/voices/**)"), "a voice clone is somebody's voice");
  for (const f of [".claude/settings.json", ".claude/hooks/lib.mjs"]) assert.equal(spawnSync("git", ["check-ignore", "-q", f], { cwd: REPO }).status, 1, `${f} must not be gitignored`);
  assert.equal(spawnSync("git", ["check-ignore", "-q", ".claude/skills/x"], { cwd: REPO }).status, 0, "the skill links stay ignored");
});
