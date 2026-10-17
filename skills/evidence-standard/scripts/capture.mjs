// Record a command's output as a capture a critic can re-check, and verify one.
//   node capture.mjs record <scratch dir> <capture file> -- <command> [args...]
//   node capture.mjs verify <capture file>
// record runs the command through sandbox-run.sh and writes <capture file>:
//   # command: ["argv", ...]  # dir: "..."  # pin: "..."  # date: ...  # exit: <n>      (header lines)
//   ---                                                                          (a line holding only this)
//   <the raw stdout and stderr, as produced>
// and <capture file>.sha256, the SHA-256 of the whole capture file (header, delimiter and output), the same
// as `shasum -a 256 <capture file>`. Set PIN to record the commit the code was at. verify recomputes it: exit 0 matches; exit 1 the capture was altered (blocking
// for a critic); exit 2 no sidecar, or not a capture (unsupported, not blocking).
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const DELIM = "\n---\n";

// The sandboxed command may leave a symlink at the capture path (or swap a directory for one) to make this
// host-side write land elsewhere. So: write a randomly named new file (flag wx, never following a link), then
// rename it into place (rename replaces the directory entry itself and never follows a link at the target).
function writeNoFollow(path, data) {
  const tmp = `${path}.tmp-${randomBytes(8).toString("hex")}`;
  writeFileSync(tmp, data, { flag: "wx" });
  renameSync(tmp, path);
}
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

export function split(buf) {
  const at = buf.indexOf(DELIM);
  if (at < 0) return null;
  return { header: buf.subarray(0, at).toString("utf8"), output: buf.subarray(at + DELIM.length) };
}

// Header values are JSON-encoded, so a newline or a `---` in a command or a path cannot forge a header line,
// the delimiter, or an exit status; the command is the argv array, so its quoting is not lost.
export function build({ command, dir, pin, date, exit, output }) {
  const header = [`# command: ${JSON.stringify(command)}`, `# dir: ${JSON.stringify(dir)}`, `# pin: ${JSON.stringify(pin || "unknown")}`, `# date: ${date}`, `# exit: ${exit}`].join("\n");
  return Buffer.concat([Buffer.from(header + DELIM), output]);
}

// `ok` means the file matches its sidecar: integrity, not provenance. Anyone can write a capture and its
// sidecar, so a critic still re-runs the command (skills/critic-grounding).
export function verify(file) {
  if (!existsSync(file)) return { code: 2, message: `no capture at ${file}` };
  if (!existsSync(`${file}.sha256`)) return { code: 2, message: `no sidecar ${file}.sha256: the capture cannot be checked (unsupported)` };
  let buf, expected;
  try {
    buf = readFileSync(file);
    expected = readFileSync(`${file}.sha256`, "utf8").trim().split(/\s+/)[0].toLowerCase();
  } catch (e) { return { code: 2, message: `cannot read the capture or its sidecar: ${e.code || e.message}` }; }
  if (!split(buf)) return { code: 2, message: "not a capture: no line holding only --- after the header" };
  if (!/^[0-9a-f]{64}$/.test(expected)) return { code: 2, message: "the sidecar does not hold a SHA-256" };
  const actual = sha(buf);
  return actual === expected ? { code: 0, message: "ok: the file matches its hash (integrity only, not proof the command ran)", expected, actual } : { code: 1, message: "the capture does not match its recorded hash: it was altered", expected, actual };
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
    if (!existsSync(dirname(resolve(file)))) { console.error(`error: the directory for ${file} does not exist; nothing was run`); return 2; }
    if (cmd[0].startsWith("-")) { console.error(`error: the command ${cmd[0]} starts with a dash; nothing was run`); return 2; }
    if (spawnSync("/bin/sh", ["-c", 'command -v -- "$1" >/dev/null', "capture", cmd[0]]).status !== 0) { console.error(`error: ${cmd[0]} is not a command on this PATH; nothing was run`); return 2; }
    const parentBefore = realpathSync(dirname(resolve(file)));
    const sbx = join(dirname(fileURLToPath(import.meta.url)), "sandbox-run.sh");
    // Preflight with `true`, so that afterwards every exit status is the command's own: the sandbox script's
    // refusal codes (2 and 3) are also codes a command may legitimately return.
    const pre = spawnSync("/bin/sh", [sbx, dir, "true"], { encoding: "utf8" });
    if (pre.status !== 0) { console.error((pre.stderr || "").trim() || "sandbox-run refused to run"); return 2; }
    const run = spawnSync("/bin/sh", ["-c", '"$@" 2>&1', "capture", sbx, dir, ...cmd], { maxBuffer: 256 * 1024 * 1024 });
    if (run.error) { console.error(`error: ${run.error.message}`); return 2; }
    if (run.status === null) { console.error(`error: the command was ended by ${run.signal || "a signal"}; nothing was recorded`); return 2; }
    if (realpathSync(dirname(resolve(file))) !== parentBefore) { console.error("error: the directory of the capture file changed while the command ran (a symlink swap?); nothing was written"); return 2; }
    const buf = build({ command: cmd, dir, pin: process.env.PIN, date: new Date().toISOString(), exit: run.status, output: run.stdout });
    writeNoFollow(file, buf);
    writeNoFollow(`${file}.sha256`, `${sha(buf)}  ${file.split("/").pop()}\n`);
    console.log(JSON.stringify({ capture: file, exit: run.status, sha256: sha(buf) }));
    return 0;
  }
  console.error("usage: capture.mjs record <scratch dir> <capture file> -- <command> [args...]  |  capture.mjs verify <capture file>");
  return 2;
}

process.exit(main(process.argv.slice(2)));
