// Link each skill in skills/ and in your own local/skills/ into .claude/skills/, where Claude
// Code finds project skills. Runs after npm install, and as npm run skills after you add one.
// Other agents find them through AGENTS.md. Never replaces anything already there, so a link
// someone made by hand (or project-sync.sh made) is left alone, and a local skill named like
// a shared one is reported rather than shadowing it.
//   node bin/link-skills.mjs [repo root]
import { existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO } from "./lib.mjs";

const root = resolve(process.argv[2] || REPO), dest = join(root, ".claude", "skills");
const exists = (p) => { try { lstatSync(p); return true; } catch { return false; } };
const shared = existsSync(join(root, "skills")) ? readdirSync(join(root, "skills")) : [];
let made = 0;
for (const dir of ["skills", join("local", "skills")]) {
  const src = join(root, dir);
  if (!existsSync(src)) continue;
  mkdirSync(dest, { recursive: true });
  for (const n of readdirSync(src).filter((n) => existsSync(join(src, n, "SKILL.md")))) {
    if (dir !== "skills" && shared.includes(n)) {
      console.warn(`local/skills/${n} has the same name as a shared skill; rename it to use it`);
      continue;
    }
    if (exists(join(dest, n))) continue;
    symlinkSync(join("..", "..", dir, n), join(dest, n));
    made++;
  }
}
if (made) console.log(`linked ${made} skill(s) into .claude/skills`);
