// Start a new video from template/.
//   node bin/new.mjs videos/<name>
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO, die } from "./lib.mjs";

const arg = process.argv[2];
if (!arg) die("name the new video's folder, e.g. videos/my-video");
const dir = resolve(arg);
// A decision video's folder may already hold the working agent's brief.md (skills/explainer-video).
const there = existsSync(dir) ? readdirSync(dir).filter((f) => f !== "brief.md" && !f.startsWith(".")) : [];
if (there.length) die(`${arg} already exists`);
cpSync(join(REPO, "template"), dir, { recursive: true, force: false, errorOnExist: false });
console.log(`${arg} is ready: write script/, then shape scenes.html, then npm run make -- ${arg}`);
