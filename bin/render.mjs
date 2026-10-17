// Render a built video to out/<name>.mp4.
//   node bin/render.mjs videos/<name> [--draft]
import { existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { HF, REPO, die, run, videoDir } from "./lib.mjs";

const dir = videoDir(process.argv[2]);
if (!existsSync(join(dir, "index.html"))) die("no index.html yet: node bin/build.mjs first");
const draft = process.argv.includes("--draft");
mkdirSync(join(REPO, "out"), { recursive: true });
const out = join(REPO, "out", `${basename(dir)}${draft ? "-draft" : ""}.mp4`);
const t0 = Date.now();
await run(HF, ["render", dir, "-o", out, "--fps", "30", "--quality", draft ? "draft" : "high", "--quiet"], { stdio: ["ignore", "inherit", "inherit"] })
  .catch((e) => die(e.message));
console.log(`${out} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
