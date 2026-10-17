// Voice, build, check and render one video.
//   node bin/make.mjs videos/<name> [--draft] [--speed 1.25]
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { HF, REPO, videoDir } from "./lib.mjs";

const dir = videoDir(process.argv[2]);
const step = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
step(process.execPath, [join(REPO, "bin", "voice.mjs"), dir, ...process.argv.slice(3)]);
step(process.execPath, [join(REPO, "bin", "build.mjs"), dir]);
step(HF, ["lint", dir]);
step(process.execPath, [join(REPO, "bin", "render.mjs"), dir, ...process.argv.slice(3)]);
