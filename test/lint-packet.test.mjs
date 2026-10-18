// bin/lint-packet.mjs: the pacing critic's objective limits, applied to a real packet (test/fixtures/packet-pacer.md, from
// videos/pacer-dev-journey) and to copies of it with one limit broken at a time.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { REPO } from "../bin/lib.mjs";
import { lintPacket, parsePacket } from "../bin/lint-packet.mjs";

const packet = readFileSync(join(REPO, "test", "fixtures", "packet-pacer.md"), "utf8");
const ids = (r) => r.findings.map((f) => f.id);

test("lint-packet: parses the scenes, pauses, cues and stillness of a real packet", () => {
  const p = parsePacket(packet);
  assert.equal(p.scenes.length, 7);
  assert.equal(p.speed, 1.25);
  assert.equal(p.targetSyllables, 263);
  assert.ok(p.pauses.length > 30 && p.cues.length > 50 && p.stills.length === 7, `${p.pauses.length} pauses, ${p.cues.length} cues, ${p.stills.length} stills`);
  assert.equal(p.cues.find((c) => c.cue === "Tokyo" && c.scene === "01-morning").at > 0, true);
});

test("lint-packet: a packet that meets the limits passes; the real one has only minor findings", () => {
  const r = lintPacket(packet);
  assert.equal(r.verdict, "pass");
  assert.ok(r.findings.every((f) => f.severity === "minor"), JSON.stringify(ids(r)));
  assert.ok(r.findings.every((f) => f.objective && f.fix && f.where && f.evidence), "every finding is a complete, objective critic finding");
  assert.ok(!ids(r).some((i) => i.startsWith("lint-scene-gap") && /the end/.test(JSON.stringify(r.findings.find((f) => f.id === i)))), "the last pause (to the end) is not a scene change");
});

test("lint-packet: each limit is caught when broken", () => {
  const broken = (from, to) => { assert.ok(packet.includes(from), `fixture lacks ${from}`); return lintPacket(packet.replace(from, to)); };
  // a scene far off the pace target
  assert.ok(ids(broken("while speaking, 266 syllables a minute", "while speaking, 340 syllables a minute")).some((i) => i.startsWith("lint-rate-")), "pace");
  assert.ok(ids(broken("while speaking, 266 syllables a minute", "while speaking, 190 syllables a minute")).some((i) => i.startsWith("lint-rate-")), "slow pace");
  // a scene over 40 s
  assert.ok(ids(broken("(20.21 s to 43.7 s,", "(20.21 s to 70.7 s,")).some((i) => i.startsWith("lint-length-")), "length");
  // a pause over 2 s
  assert.ok(ids(broken("| 4.22 | 0.28 | 01-morning -> 01-morning |", "| 4.22 | 2.5 | 01-morning -> 01-morning |")).some((i) => i.startsWith("lint-pause-")), "pause");
  // rushed sentences
  assert.ok(ids(broken("| 4.22 | 0.28 | 01-morning -> 01-morning |", "| 4.22 | 0.1 | 01-morning -> 01-morning |")).some((i) => i.startsWith("lint-gap-")), "gap");
  // a scene change with no breath
  const tight = packet.replace(/\| ([\d.]+) \| 1\.1\d \| 01-morning -> 02-notes \|/, "| $1 | 0.3 | 01-morning -> 02-notes |");
  assert.notEqual(tight, packet, "the fixture has a scene change to shorten");
  assert.ok(ids(lintPacket(tight)).some((i) => i.startsWith("lint-scene-gap-")), "scene gap");
  // reading flags and stillness
  const cue = packet.split("\n").find((l) => /^\| [\d.]+ \| 02-notes \| `pacing#1`/.test(l));
  assert.ok(cue);
  const flagged = (flag) => lintPacket(packet.replace(cue, cue.replace(/\| [^|]*\|\s*$/, `| ${flag} |`)));
  assert.ok(ids(flagged("(short: stays up 1.2; late: read by 99 s, the scene ends at 40 s)")).some((i) => i.startsWith("lint-short-")));
  assert.ok(ids(flagged("(late: read by 99 s, the scene ends at 40 s)")).some((i) => i.startsWith("lint-late-")));
  const still = packet.split("\n").find((l) => /^\| 03-units \| [\d.]+ \|/.test(l));
  assert.ok(ids(lintPacket(packet.replace(still, still.replace(/\| [\d.]+ \|/, "| 03-units | 13.5 |").replace("| 03-units | 03-units", "| 03-units")))).includes("lint-still-03-units"), "stillness over 12 s");
  assert.equal(lintPacket(packet.replace("speed 1.25:", "speed 2:")).findings.some((f) => f.id === "lint-speed"), true, "an unusual speed is said once");
  assert.equal(lintPacket(packet.replace(/\| [\d.]+ \| 0\.\d+ \| (\S+) -> the end \|/, "| 169.9 | 3 | $1 -> the end |")).findings.some((f) => f.id.startsWith("lint-pause-")), false, "a long pause at the very end is allowed");
});

test("lint-packet: the command reads review/packet.md, prints findings, and exits by severity", () => {
  const dir = mkdtempSync(join(tmpdir(), "kx-lint-"));
  mkdirSync(join(dir, "review"), { recursive: true });
  writeFileSync(join(dir, "video.json"), JSON.stringify({ title: "x", kind: "feature" }));
  const run = (...a) => spawnSync(process.execPath, [join(REPO, "bin", "lint-packet.mjs"), dir, ...a], { encoding: "utf8" });
  assert.equal(run().status, 2, "no packet yet");
  writeFileSync(join(dir, "review", "packet.md"), packet);
  const ok = run("--json");
  assert.equal(ok.status, 0);
  assert.equal(JSON.parse(ok.stdout).critic, "lint-packet");
  writeFileSync(join(dir, "review", "packet.md"), packet.replace("while speaking, 266 syllables a minute", "while speaking, 340 syllables a minute"));
  const bad = run();
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /major .*02-notes.*340 syllables/);
  writeFileSync(join(dir, "review", "packet.md"), "not a packet");
  assert.equal(run().status, 2, "an unreadable packet is an error, not a pass");
});
