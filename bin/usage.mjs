// Token and context use of a Claude Code session and the subagents it spawned, read from the
// session transcripts Claude Code already writes under ~/.claude/projects/. Output tokens are as
// recorded in the transcript, which may undercount a call that was still streaming when it was logged.
//   node bin/usage.mjs [session id | transcript path] [--json]
// With no argument: the newest session of this repo. Context is the prompt size of one API
// call (fresh + cache-written + cache-read input tokens); "peak" is the largest of them.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { REPO } from "./lib.mjs";

const projects = process.env.CLAUDE_PROJECTS_DIR || join(homedir(), ".claude", "projects");

// One agent's transcript: sum usage per API call (a call can span several lines).
export function readTranscript(file) {
  const calls = new Map();
  let first = null, last = null, model = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    let d; try { d = JSON.parse(line); } catch { continue; }
    if (d.timestamp) { first ??= d.timestamp; last = d.timestamp; }
    const u = d.message?.usage;
    if (d.type !== "assistant" || !u) continue;
    model = d.message.model || model;
    const id = d.message.id || d.uuid;
    const prev = calls.get(id);
    if (!prev || (u.output_tokens || 0) >= prev.output_tokens) calls.set(id, u);
  }
  const t = { calls: calls.size, input: 0, output: 0, cacheWrite: 0, cacheRead: 0, peakContext: 0, lastContext: 0, model, first, last };
  for (const u of calls.values()) {
    const ctx = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
    t.input += u.input_tokens || 0; t.output += u.output_tokens || 0;
    t.cacheWrite += u.cache_creation_input_tokens || 0; t.cacheRead += u.cache_read_input_tokens || 0;
    t.peakContext = Math.max(t.peakContext, ctx); t.lastContext = ctx;
  }
  return t;
}

// The session's own transcript, then <session>/subagents/agent-*.jsonl.
export function readSession(file) {
  const dir = file.replace(/\.jsonl$/, "");
  const agents = [{ name: "main", ...readTranscript(file) }];
  const sub = join(dir, "subagents");
  if (existsSync(sub)) {
    for (const f of readdirSync(sub).filter((f) => /^agent-.*\.jsonl$/.test(f)).sort()) {
      agents.push({ name: basename(f, ".jsonl").replace(/^agent-/, "").slice(0, 8), ...readTranscript(join(sub, f)) });
    }
  }
  return agents;
}

export function findSession(arg, repo = REPO) {
  if (arg && existsSync(resolve(arg))) return resolve(arg);
  const dir = join(projects, resolve(repo).replace(/[^A-Za-z0-9]/g, "-"));
  if (!existsSync(dir)) throw new Error(`no transcripts at ${dir}`);
  const all = readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f));
  const hit = arg ? all.find((f) => basename(f).startsWith(arg)) : all.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  if (!hit) throw new Error(arg ? `no session starting ${arg} in ${dir}` : `no sessions in ${dir}`);
  return hit;
}

const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n));
const secs = (a) => (a.first && a.last ? Math.round((Date.parse(a.last) - Date.parse(a.first)) / 1000) : 0);

// Run as a script, also from a path with a space or through a symlink: compare real paths, never URLs.
let entry = false;
try { entry = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { entry = false; }
if (entry) {
  const args = process.argv.slice(2), json = args.includes("--json");
  const file = findSession(args.find((a) => !a.startsWith("--")));
  const agents = readSession(file);
  const total = agents.reduce((s, a) => ({ calls: s.calls + a.calls, input: s.input + a.input, output: s.output + a.output, cacheWrite: s.cacheWrite + a.cacheWrite, cacheRead: s.cacheRead + a.cacheRead }), { calls: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
  if (json) { console.log(JSON.stringify({ session: basename(file, ".jsonl"), agents, total }, null, 2)); process.exit(0); }
  console.log(`session ${basename(file, ".jsonl")}`);
  console.log("agent     calls   input  output  cache-wr  cache-rd  peak-ctx  last-ctx  secs  model");
  for (const a of [...agents, { name: "TOTAL", ...total, peakContext: Math.max(...agents.map((a) => a.peakContext)), lastContext: 0, model: "" }]) {
    console.log([a.name.padEnd(8), String(a.calls).padStart(6), k(a.input).padStart(7), k(a.output).padStart(7), k(a.cacheWrite).padStart(9), k(a.cacheRead).padStart(9), k(a.peakContext).padStart(9), (a.lastContext ? k(a.lastContext) : "").padStart(9), String(a.name === "TOTAL" ? "" : secs(a)).padStart(5), " " + (a.model || "")].join(" "));
  }
}
