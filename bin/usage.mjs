// Token and context use of a Claude Code session and the subagents it spawned, read from the
// session transcripts Claude Code already writes under ~/.claude/projects/. Output tokens are as
// recorded in the transcript, which may undercount a call that was still streaming when it was logged.
//   node bin/usage.mjs [session id | transcript path] [--json] [--since <ISO time>] [--until <ISO time>]
// With no argument: the newest session of this repo. Context is the prompt size of one API
// call (fresh + cache-written + cache-read input tokens); "peak" is the largest of them.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { REPO } from "./lib.mjs";

const projects = process.env.CLAUDE_PROJECTS_DIR || join(homedir(), ".claude", "projects");

// One agent's transcript: sum usage per API call (a call can span several lines).
// since and until (ISO times) keep only the API calls logged inside that window, so one task's cost is not the session's.
export function readTranscript(file, { since, until } = {}) {
  const calls = new Map();
  let first = null, last = null, model = null, bad = 0;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let d; try { d = JSON.parse(line); } catch { bad++; continue; }
    if (d.timestamp && ((since && d.timestamp < since) || (until && d.timestamp > until))) continue;
    if (d.timestamp) { first ??= d.timestamp; last = d.timestamp; }
    const u = d.message?.usage;
    if (d.type !== "assistant" || !u) continue;
    model = d.message.model || model;
    const id = d.message.id || d.uuid;
    const prev = calls.get(id);
    if (!prev || (u.output_tokens || 0) >= prev.output_tokens) calls.set(id, u);
  }
  const t = { bad, calls: calls.size, input: 0, output: 0, cacheWrite: 0, cacheRead: 0, peakContext: 0, lastContext: 0, model, first, last };
  // a count that is not a non-negative number is a bad record, counted as zero, never string-concatenated into a total
  const n = (x) => (Number.isFinite(x) && x >= 0 ? x : (t.bad++, 0));
  for (const u of calls.values()) {
    const [i, o, w, r] = [n(u.input_tokens ?? 0), n(u.output_tokens ?? 0), n(u.cache_creation_input_tokens ?? 0), n(u.cache_read_input_tokens ?? 0)];
    const ctx = i + w + r;
    t.input += i; t.output += o; t.cacheWrite += w; t.cacheRead += r;
    t.peakContext = Math.max(t.peakContext, ctx); t.lastContext = ctx;
  }
  return t;
}

// The session's own transcript, then <session>/subagents/agent-*.jsonl.
export function readSession(file, window = {}) {
  const dir = file.replace(/\.jsonl$/, "");
  const agents = [{ name: "main", ...readTranscript(file, window) }];
  const sub = join(dir, "subagents");
  if (existsSync(sub)) {
    for (const f of readdirSync(sub).filter((f) => /^agent-.*\.jsonl$/.test(f)).sort()) {
      agents.push({ name: basename(f, ".jsonl").replace(/^agent-/, "").slice(0, 8), ...readTranscript(join(sub, f), window) });
    }
  }
  return agents;
}

export function findSession(arg, repo = REPO) {
  // a path to a transcript file is used as it is; anything else is a session id prefix
  if (arg && existsSync(resolve(arg)) && statSync(resolve(arg)).isFile()) return resolve(arg);
  const dir = join(projects, resolve(repo).replace(/[^A-Za-z0-9]/g, "-"));
  if (!existsSync(dir)) throw new Error(`no transcripts at ${dir} (set CLAUDE_PROJECTS_DIR, or pass a transcript file)`);
  const all = readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f));
  if (arg) {
    const hits = all.filter((f) => basename(f).startsWith(arg));
    if (hits.length > 1) throw new Error(`"${arg}" matches ${hits.length} sessions: ${hits.map((f) => basename(f, ".jsonl")).join(", ")}`);
    if (!hits.length) throw new Error(`no session starting ${arg} in ${dir}`);
    return hits[0];
  }
  const newest = all.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  if (!newest) throw new Error(`no sessions in ${dir}`);
  return newest;
}

const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n));
const secs = (a) => {
  const d = a.first && a.last ? Math.round((Date.parse(a.last) - Date.parse(a.first)) / 1000) : 0;
  return Number.isFinite(d) ? d : 0;
};

// Run as a script, also from a path with a space or through a symlink: compare real paths, never URLs.
let entry = false;
try { entry = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { entry = false; }
if (entry) {
  const raw = process.argv.slice(2), json = raw.includes("--json"), window = {}, args = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "--since" || raw[i] === "--until") {
      const v = raw[++i];
      if (!v || Number.isNaN(Date.parse(v))) { console.error(`${raw[i - 1]} needs an ISO time, for example 2026-10-17T21:23:38Z`); process.exit(2); }
      window[raw[i - 1].slice(2)] = new Date(v).toISOString();
    } else args.push(raw[i]);
  }
  const unknown = args.filter((a) => a.startsWith("-") && a !== "--json");
  if (unknown.length) { console.error(`unknown option ${unknown[0]}; usage: node bin/usage.mjs [session id | transcript file] [--json] [--since <ISO time>] [--until <ISO time>]`); process.exit(2); }
  let file, agents;
  try {
    file = findSession(args.find((a) => !a.startsWith("--")));
    agents = readSession(file, window).filter((a) => a.name === "main" || a.calls > 0);
  } catch (e) { console.error(`error: ${e.message}`); process.exit(2); }
  const bad = agents.reduce((n, a) => n + (a.bad || 0), 0);
  if (bad) console.error(`warning: ${bad} line(s) in the transcript(s) could not be read; the figures may undercount`);
  if (agents.every((a) => a.calls === 0)) console.error("warning: no usage records found in this transcript");
  const total = agents.reduce((s, a) => ({ calls: s.calls + a.calls, input: s.input + a.input, output: s.output + a.output, cacheWrite: s.cacheWrite + a.cacheWrite, cacheRead: s.cacheRead + a.cacheRead }), { calls: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
  if (json) { console.log(JSON.stringify({ session: basename(file, ".jsonl"), ...(window.since || window.until ? { window } : {}), agents, total }, null, 2)); process.exit(0); }
  console.log(`session ${basename(file, ".jsonl")}`);
  console.log("agent     calls   input  output  cache-wr  cache-rd  peak-ctx  last-ctx  secs  model");
  for (const a of [...agents, { name: "TOTAL", ...total, peakContext: Math.max(...agents.map((a) => a.peakContext)), lastContext: 0, model: "" }]) {
    console.log([a.name.padEnd(8), String(a.calls).padStart(6), k(a.input).padStart(7), k(a.output).padStart(7), k(a.cacheWrite).padStart(9), k(a.cacheRead).padStart(9), k(a.peakContext).padStart(9), (a.lastContext ? k(a.lastContext) : "").padStart(9), String(a.name === "TOTAL" ? "" : secs(a)).padStart(5), " " + (a.model || "")].join(" "));
  }
}
