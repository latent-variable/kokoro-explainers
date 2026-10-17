// Record a command's output as a capture a critic can re-check, and verify one.
//   node capture.mjs record <scratch dir> <capture file> -- <command> [args...]
//   node capture.mjs verify <capture file>
// record runs the command through sandbox-run.sh and writes <capture file>:
//   # command: ...    # dir: ...    # pin: ...    # date: ...    # exit: <n>      (header lines)
//   ---                                                                          (a line holding only this)
//   <the raw stdout and stderr, as produced>
// and <capture file>.sha256, the SHA-256 of the whole capture file (header, delimiter and output), the same
// as `shasum -a 256 <capture file>`. Set PIN to record the commit the code was at. verify recomputes it: exit 0 matches; exit 1 the capture was altered (blocking
// for a critic); exit 2 no sidecar, or not a capture (unsupported, not blocking).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const DELIM = "\n---\n";
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

export function split(buf) {
  const at = buf.indexOf(DELIM);
  if (at < 0) return null;
  return { header: buf.subarray(0, at).toString("utf8"), output: buf.subarray(at + DELIM.length) };
}

export function build({ command, dir, pin, date, exit, output }) {
  const header = [`# command: ${command}`, `# dir: ${dir}`, `# pin: ${pin || "unknown"}`, `# date: ${date}`, `# exit: ${exit}`].join("\n");
  return Buffer.concat([Buffer.from(header + DELIM), output]);
}

export function verify(file) {
  if (!existsSync(file)) return { code: 2, message: `no capture at ${file}` };
  if (!existsSync(`${file}.sha256`)) return { code: 2, message: `no sidecar ${file}.sha256: the capture cannot be checked (unsupported)` };
  const buf = readFileSync(file);
  if (!split(buf)) return { code: 2, message: "not a capture: no line holding only --- after the header" };
  const expected = readFileSync(`${file}.sha256`, "utf8").trim().split(/\s+/)[0];
  const actual = sha(buf);
  return actual === expected ? { code: 0, message: "ok", expected, actual } : { code: 1, message: "the capture does not match its recorded hash: it was altered", expected, actual };
}

function main(argv) {
  const [mode, ...rest] = argv;
  if (mode === "verify" && rest.length === 1) {
    const r = verify(rest[0]);
    console.log(JSON.stringify(r));
    return r.code;
  }
  if (mode === "record") {
    const dd = rest.indexOf("--");
    if (dd !== 2 || rest.length < 4) { console.error("usage: capture.mjs record <scratch dir> <capture file> -- <command> [args...]"); return 2; }
    const [dir, file] = rest;
    const cmd = rest.slice(3);
    const sbx = join(dirname(fileURLToPath(import.meta.url)), "sandbox-run.sh");
    // Preflight with `true`, so that afterwards every exit status is the command's own: the sandbox script's
    // refusal codes (2 and 3) are also codes a command may legitimately return.
    const pre = spawnSync("/bin/sh", [sbx, dir, "true"], { encoding: "utf8" });
    if (pre.status !== 0) { console.error((pre.stderr || "").trim() || "sandbox-run refused to run"); return 2; }
    const run = spawnSync("/bin/sh", ["-c", '"$@" 2>&1', "capture", sbx, dir, ...cmd], { maxBuffer: 256 * 1024 * 1024 });
    if (run.error) { console.error(`error: ${run.error.message}`); return 2; }
    const buf = build({ command: cmd.join(" "), dir, pin: process.env.PIN, date: new Date().toISOString(), exit: run.status, output: run.stdout });
    writeFileSync(file, buf);
    writeFileSync(`${file}.sha256`, `${sha(buf)}  ${file.split("/").pop()}\n`);
    console.log(JSON.stringify({ capture: file, exit: run.status, sha256: sha(buf) }));
    return 0;
  }
  console.error("usage: capture.mjs record <scratch dir> <capture file> -- <command> [args...]  |  capture.mjs verify <capture file>");
  return 2;
}

process.exit(main(process.argv.slice(2)));
