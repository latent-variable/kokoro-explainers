// Link each skill in skills/ into .claude/skills/, where Claude Code finds project skills.
// Runs after npm install. Other agents find them through AGENTS.md. Never replaces anything
// already there, so a link someone made by hand (or project-sync.sh made) is left alone.
import { existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./lib.mjs";

const src = join(REPO, "skills"), dest = join(REPO, ".claude", "skills");
const exists = (p) => { try { lstatSync(p); return true; } catch { return false; } };
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  const made = readdirSync(src).filter((n) => existsSync(join(src, n, "SKILL.md")) && !exists(join(dest, n)));
  for (const n of made) symlinkSync(join("..", "..", "skills", n), join(dest, n));
  if (made.length) console.log(`linked ${made.length} skill(s) into .claude/skills`);
}
