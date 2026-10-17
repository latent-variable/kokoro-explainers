// Start a new video from template/.
//   node bin/new.mjs videos/<name>
import { cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { REPO, die } from "./lib.mjs";

const arg = process.argv[2];
if (!arg) die("name the new video's folder, e.g. videos/my-video");
const dir = resolve(arg);
if (existsSync(dir)) die(`${arg} already exists`);
cpSync(join(REPO, "template"), dir, { recursive: true });
console.log(`${arg} is ready: write script/, then shape scenes.html, then npm run make -- ${arg}`);
