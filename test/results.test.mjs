// bin/results.mjs and usage.mjs --since: a run's cost and critic record, from files that already exist.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { REPO } from "../bin/lib.mjs";

const call = (id, ts, out, extra = {}) => JSON.stringify({ type: "assistant", timestamp: ts, message: { id, model: "claude-sonnet-5-5", usage: { input_tokens: 1, output_tokens: out, cache_creation_input_tokens: 10, cache_read_input_tokens: 100, ...extra } } });

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "kx-results-"));
  const proj = join(root, "projects", REPO.replace(/[^A-Za-z0-9]/g, "-"));
  mkdirSync(join(proj, "sess", "subagents"), { recursive: true });
  writeFileSync(join(proj, "sess.jsonl"), [call("a", "2026-10-17T10:00:00.000Z", 500), call("b", "2026-10-17T12:00:00.000Z", 7), call("c", "2026-10-17T12:30:00.000Z", 3)].join("\n") + "\n");
  writeFileSync(join(proj, "sess", "subagents", "agent-deadbeef1234.jsonl"), [call("s1", "2026-10-17T09:00:00.000Z", 900), call("s2", "2026-10-17T12:10:00.000Z", 11)].join("\n") + "\n");
  writeFileSync(join(proj, "sess", "subagents", "agent-cafe00000000.jsonl"), call("s3", "2026-10-17T08:00:00.000Z", 1) + "\n"); // wholly before the window
  const video = join(root, "video");
  mkdirSync(join(video, "review", "round-1"), { recursive: true });
  mkdirSync(join(video, "script"), { recursive: true });
  writeFileSync(join(video, "video.json"), JSON.stringify({ title: "Demo", kind: "feature", audience: "a developer", importance: "normal", importance_reason: "test" }));
  writeFileSync(join(video, "timing.json"), JSON.stringify({ total: 42.5, voice: "af_heart", scenes: [{ sentences: [{}, {}] }, { sentences: [{}] }] }));
  writeFileSync(join(video, "script", "01-a.txt"), "one two three four five\n");
  writeFileSync(join(video, "review", "round-1", "critic-accuracy.json"), JSON.stringify({ critic: "critic-accuracy", verdict: "fail", findings: [{ severity: "major", objective: true }, { severity: "minor", objective: false }] }));
  writeFileSync(join(video, "review", "round-1", "critic-pacing.json"), JSON.stringify({ critic: "critic-pacing", verdict: "pass", findings: [] }));
  writeFileSync(join(video, "review", "scenario.txt"), "captured\n");
  writeFileSync(join(video, "review", "scenario.txt.sha256"), "abc\n");
  writeFileSync(join(video, "review", "loose.txt"), "no hash beside it\n");
  return { root, video, env: { ...process.env, CLAUDE_PROJECTS_DIR: join(root, "projects") } };
}
const run = (script, args, env) => spawnSync(process.execPath, [join(REPO, "bin", script), ...args], { encoding: "utf8", env });

test("usage --since keeps only the calls inside the window, subagents included, and drops an agent with none", () => {
  const { env } = fixture();
  const all = JSON.parse(run("usage.mjs", ["--json"], env).stdout);
  assert.equal(all.total.calls, 6);
  const w = run("usage.mjs", ["--json", "--since", "2026-10-17T11:00:00Z"], env);
  assert.equal(w.status, 0, w.stderr);
  const j = JSON.parse(w.stdout);
  assert.equal(j.total.calls, 3, "b, c and s2");
  assert.equal(j.total.output, 7 + 3 + 11);
  assert.deepEqual(j.agents.map((a) => a.name).sort(), ["deadbeef", "main"], "the subagent wholly before the window is dropped");
  const u = JSON.parse(run("usage.mjs", ["--json", "--since", "2026-10-17T11:00:00Z", "--until", "2026-10-17T12:15:00Z"], env).stdout);
  assert.equal(u.total.calls, 2, "b and s2");
  assert.equal(run("usage.mjs", ["--since", "yesterday-ish"], env).status, 2, "a bad time is refused");
});

test("results: writes the run record, the usage window, the critic rounds and the captures with hashes", () => {
  const { video, env } = fixture();
  const r = run("results.mjs", [video, "--since", "2026-10-17T11:00:00Z"], env);
  assert.equal(r.status, 0, r.stderr);
  const out = join(video, "results");
  const u = JSON.parse(readFileSync(join(out, "usage-delta.json"), "utf8"));
  assert.equal(u.total.calls, 3);
  assert.equal(u.generated_by, "bin/results.mjs");
  const c = JSON.parse(readFileSync(join(out, "critic-rounds.json"), "utf8"));
  assert.deepEqual(c.rounds["round-1"].totals, { findings: 2, blocking: 0, major: 1, minor: 1, failed: 1 });
  assert.equal(c.rounds["round-1"].critics["critic-accuracy"].objective, 1);
  const run1 = JSON.parse(readFileSync(join(out, "run.json"), "utf8"));
  assert.equal(run1.video_stats.duration_s, 42.5);
  assert.equal(run1.video_stats.sentences, 3);
  assert.equal(run1.video_stats.script_words, 5);
  assert.equal(run1.plan.preset, "standard");
  assert.deepEqual(run1.captures, ["scenario.txt"]);
  assert.ok(existsSync(join(out, "captures", "scenario.txt.sha256")));
  assert.ok(!existsSync(join(out, "captures", "loose.txt")), "a capture with no hash beside it is not copied");
  assert.match(readFileSync(join(out, "run.md"), "utf8"), /\| main \| 2 \|/);
});

test("results: start marks the window, and a hand-written file is never overwritten", () => {
  const { video, env } = fixture();
  assert.equal(run("results.mjs", [video, "start"], env).status, 0);
  const start = JSON.parse(readFileSync(join(video, "results", "run-start.json"), "utf8"));
  assert.ok(Math.abs(Date.now() - Date.parse(start.started)) < 60000, "the start is now");
  const hand = join(video, "results", "run.md");
  writeFileSync(hand, "# my own notes\n");
  const r = run("results.mjs", [video, "--since", "2026-10-17T11:00:00Z"], env);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(hand, "utf8"), "# my own notes\n", "a person's run.md stays");
  assert.ok(existsSync(join(video, "results", "run.generated.md")), "the new one is written beside it");
  assert.equal(run("results.mjs", [], env).status, 1, "no folder is an error");
});
