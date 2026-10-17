// PreToolUse on Bash: refuse the commands that delete or rewrite work. This repo's rule is that the scripts never
// delete files and an agent moves things aside instead (AGENTS.md, Traps). SHIPSHOW_ALLOW_DESTRUCTIVE=1 in the
// environment lets a person run one on purpose.
import { fileURLToPath } from "node:url";
import { deny, input } from "./lib.mjs";

const WRAPPERS = new Set(["sudo", "command", "env", "time", "nice", "nohup", "xargs", "exec"]);
const SHELLS = new Set(["bash", "sh", "zsh", "dash"]);

// Split on ; & | and newlines outside quotes; return each segment as words with the quotes removed.
export function segments(cmd) {
  const out = [];
  let words = [], cur = "", q = null, has = false;
  const endWord = () => { if (has) words.push(cur); cur = ""; has = false; };
  const endSeg = () => { endWord(); if (words.length) out.push(words); words = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) { if (c === q) q = null; else if (c === "\\" && q === '"' && i + 1 < cmd.length) cur += cmd[++i]; else cur += c; continue; }
    if (c === "'" || c === '"') { q = c; has = true; continue; }
    if (c === "\\" && i + 1 < cmd.length) { cur += cmd[++i]; has = true; continue; }
    if (c === ";" || c === "&" || c === "|" || c === "\n") { endSeg(); continue; }
    if (c === " " || c === "\t") { endWord(); continue; }
    cur += c; has = true;
  }
  endSeg();
  return out;
}

function gitReason(args) {
  // skip git's own options (and the value of those that take one) to find the subcommand
  let i = 0;
  while (i < args.length && args[i].startsWith("-")) i += ["-C", "-c", "--git-dir", "--work-tree", "--namespace"].includes(args[i]) ? 2 : 1;
  const sub = args[i];
  const rest = args.slice(i + 1);
  if (sub === "restore") return "git restore overwrites uncommitted work";
  if (sub === "clean") return "git clean deletes untracked files";
  if (sub === "reset" && rest.includes("--hard")) return "git reset --hard discards work";
  if (sub === "checkout" && (rest.includes("--") || rest.includes("."))) return "git checkout -- discards uncommitted changes";
  if (sub === "branch" && rest.includes("-D")) return "git branch -D deletes a branch that may be unmerged";
  if (sub === "stash" && ["drop", "clear"].includes(rest[0])) return "git stash drop loses stashed work";
  if (sub === "push" && rest.some((a) => a === "--force" || a === "-f" || a.startsWith("--force-with-lease"))) return "a force push rewrites shared history";
  return null;
}

// Why a command is refused, or null.
export function reason(cmd, depth = 0) {
  if (depth > 3) return null;
  for (const inner of [...cmd.matchAll(/\$\(([^()]*)\)/g), ...cmd.matchAll(/`([^`]*)`/g)]) {
    const r = reason(inner[1], depth + 1);
    if (r) return r;
  }
  for (let w of segments(cmd)) {
    while (w.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0]) || WRAPPERS.has(w[0]))) w = w.slice(1);
    if (!w.length) continue;
    const base = w[0].split("/").pop();
    if (["rm", "unlink", "shred"].includes(base)) return `${base} deletes files, and this repo's scripts and agents never do: move it aside with mv (AGENTS.md, Traps)`;
    if (base === "find" && (w.includes("-delete") || (w.includes("-exec") && w.some((x) => ["rm", "unlink"].includes(x))))) return "find with -delete or -exec rm deletes files: move them aside instead";
    if (base === "git") { const r = gitReason(w.slice(1)); if (r) return r; }
    if (SHELLS.has(base)) {
      const i = w.indexOf("-c");
      if (i > 0 && w[i + 1]) { const r = reason(w[i + 1], depth + 1); if (r) return r; }
    }
    if (base === "eval" && w[1]) { const r = reason(w.slice(1).join(" "), depth + 1); if (r) return r; }
  }
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = input();
  const cmd = i.tool_input?.command;
  if (typeof cmd === "string" && process.env.SHIPSHOW_ALLOW_DESTRUCTIVE !== "1") {
    const r = reason(cmd);
    if (r) deny(`Blocked: ${r}. If a person asked for exactly this, they can set SHIPSHOW_ALLOW_DESTRUCTIVE=1.`);
  }
}
