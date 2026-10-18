// Write a video's results/ folder: what the run cost and what the critics found, from files that already exist.
//   node bin/results.mjs <video folder> start     mark the start of the run (results/run-start.json)
//   node bin/results.mjs <video folder> [--since <ISO time>]   write the record
// Writes results/run.json, usage-delta.json (tokens from the session's transcripts since the start, subagents
// included: bin/usage.mjs), critic-rounds.json (verdicts and findings by severity from review/round-N/*.json), run.md,
// and copies each review/*.txt capture that has a .sha256 beside it into results/captures/. A file that is already
// there and was not written by this script is left alone: the new one is written beside it as <name>.generated.<ext>.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REPO, config, die, reviewPlan, videoDir } from "./lib.mjs";
import { findSession, readSession } from "./usage.mjs";

const MARK = "bin/results.mjs";
const sh = (cmd, args, cwd = REPO) => { const r = spawnSync(cmd, args, { cwd, encoding: "utf8" }); return r.status === 0 ? r.stdout.trim() : null; };
const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));

// Write a file unless a person's own is there: then write beside it.
function put(dir, name, text) {
  const f = join(dir, name);
  const ours = !existsSync(f) || readFileSync(f, "utf8").slice(0, 400).includes(MARK);
  const target = ours ? f : f.replace(/(\.[^.]+)$/, ".generated$1");
  writeFileSync(target, text);
  return basename(target);
}

export function criticRounds(videoDir) {
  const rounds = {};
  const reviewDir = join(videoDir, "review");
  if (!existsSync(reviewDir)) return rounds;
  for (const d of readdirSync(reviewDir).filter((d) => /^round-\d+$/.test(d)).sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))) {
    const r = { critics: {}, totals: { findings: 0, blocking: 0, major: 0, minor: 0, failed: 0 } };
    for (const f of readdirSync(join(reviewDir, d)).filter((f) => f.endsWith(".json")).sort()) {
      let j;
      try { j = readJson(join(reviewDir, d, f)); } catch { continue; }
      const c = { verdict: j.verdict, blocking: 0, major: 0, minor: 0, objective: 0 };
      for (const x of j.findings || []) { if (c[x.severity] !== undefined) { c[x.severity]++; r.totals[x.severity]++; } r.totals.findings++; if (x.objective) c.objective++; }
      if (j.verdict === "fail") r.totals.failed++;
      r.critics[j.critic || basename(f, ".json")] = c;
    }
    rounds[d] = r;
  }
  return rounds;
}

export function usageSince(since, until) {
  const file = findSession();
  const agents = readSession(file, { ...(since && { since }), ...(until && { until }) }).filter((a) => a.name === "main" || a.calls > 0);
  const total = agents.reduce((s, a) => ({ calls: s.calls + a.calls, input: s.input + a.input, output: s.output + a.output, cacheWrite: s.cacheWrite + a.cacheWrite, cacheRead: s.cacheRead + a.cacheRead }), { calls: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
  return { session: basename(file, ".jsonl"), window: { since, until }, agents, total };
}

const fmt = (n) => n.toLocaleString("en-US");

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith("-")) die("usage: node bin/results.mjs <video folder> [start | --since <ISO time>]");
  const dir = videoDir(args[0]);
  const out = join(dir, "results");
  mkdirSync(out, { recursive: true });
  if (args[1] === "start") {
    const t = new Date().toISOString();
    put(out, "run-start.json", JSON.stringify({ generated_by: MARK, started: t, branch: sh("git", ["branch", "--show-current"]), commit: sh("git", ["rev-parse", "HEAD"]) }, null, 2) + "\n");
    console.log(`run started ${t}`);
    process.exit(0);
  }
  let since;
  const si = args.indexOf("--since");
  if (si >= 0) { since = args[si + 1]; if (!since || Number.isNaN(Date.parse(since))) die("--since needs an ISO time"); since = new Date(since).toISOString(); }
  else if (existsSync(join(out, "run-start.json"))) since = readJson(join(out, "run-start.json")).started;
  else console.error("warning: no --since and no results/run-start.json: the usage figures cover the whole session");
  const finished = new Date().toISOString();

  const cfg = config(dir, []);
  const plan = reviewPlan(cfg, []);
  const timing = existsSync(join(dir, "timing.json")) ? readJson(join(dir, "timing.json")) : null;
  const words = existsSync(join(dir, "script")) ? readdirSync(join(dir, "script")).reduce((n, f) => n + readFileSync(join(dir, "script", f), "utf8").split(/\s+/).filter(Boolean).length, 0) : null;
  const rounds = criticRounds(dir);
  let usage = null;
  try { usage = usageSince(since, finished); } catch (e) { console.error(`warning: no usage figures (${e.message})`); }

  // captures: only files with a hash beside them, so a critic can verify them
  const captures = [];
  const review = join(dir, "review");
  if (existsSync(review)) {
    mkdirSync(join(out, "captures"), { recursive: true });
    for (const f of readdirSync(review).filter((f) => f.endsWith(".txt") && existsSync(join(review, `${f}.sha256`)))) {
      copyFileSync(join(review, f), join(out, "captures", f));
      copyFileSync(join(review, `${f}.sha256`), join(out, "captures", `${f}.sha256`));
      captures.push(f);
    }
  }

  const run = {
    generated_by: MARK,
    video: basename(dir), title: cfg.title, branch: sh("git", ["branch", "--show-current"]), repo_commit: sh("git", ["rev-parse", "HEAD"]),
    started: since ?? null, finished,
    plan: { preset: plan.preset, from: plan.presetFrom, importance: plan.importance, critics: plan.critics, rounds: plan.rounds, model: plan.model, estimate: plan.estimate },
    video_stats: timing ? { duration_s: timing.total, scenes: timing.scenes.length, sentences: timing.scenes.reduce((n, s) => n + s.sentences.length, 0), voice: timing.voice, engine: timing.engine ?? "kokoro", speed: cfg.speed, script_words: words } : null,
    versions: { node: process.version, claude_code: sh("claude", ["--version"]), ffmpeg: (sh("ffmpeg", ["-version"]) || "").split("\n")[0] || null, python: sh(join(REPO, ".venv", "bin", "python"), ["--version"]) },
    captures,
  };
  const written = [
    put(out, "run.json", JSON.stringify(run, null, 2) + "\n"),
    put(out, "critic-rounds.json", JSON.stringify({ generated_by: MARK, plan_estimate: plan.estimate, rounds }, null, 2) + "\n"),
  ];
  if (usage) written.push(put(out, "usage-delta.json", JSON.stringify({ generated_by: MARK, note: "tokens from npm run usage's transcripts inside the window; subagents (critics) are the rows that are not main; cache reads dominate", ...usage }, null, 2) + "\n"));
  const rows = (usage?.agents || []).map((a) => `| ${a.name} | ${a.calls} | ${fmt(a.output)} | ${fmt(a.cacheWrite)} | ${fmt(a.cacheRead)} |`);
  const roundRows = Object.entries(rounds).map(([n, r]) => `| ${n} | ${Object.keys(r.critics).length} | ${r.totals.failed} | ${r.totals.blocking} / ${r.totals.major} / ${r.totals.minor} |`);
  written.push(put(out, "run.md", `<!-- written by ${MARK}; edit by hand and the next run writes run.generated.md beside it -->
# Run record: ${basename(dir)}

${timing ? `A ${timing.total} s video, ${timing.scenes.length} scenes, voice ${timing.voice}, speed ${cfg.speed}.` : "No timing.json: the video was not voiced."}
Review plan: ${plan.preset} (from ${plan.presetFrom}), up to ${plan.rounds} rounds, ${plan.critics.length} critics, model ${plan.model}; estimate about ${plan.estimate.firstRoundTokens}k tokens for round one.
Window: ${since ?? "whole session"} to ${finished}.

## Tokens (agents inside the window)
| agent | calls | output | cache write | cache read |
|---|---|---|---|---|
${rows.join("\n") || "| none | | | | |"}

## Critic rounds
| round | critics | failed | blocking / major / minor |
|---|---|---|---|
${roundRows.join("\n") || "| none recorded in review/round-N/ | | | |"}
`));
  console.log(`results for ${basename(dir)}: ${written.join(", ")}${captures.length ? `; ${captures.length} captures copied` : ""}`);
}
