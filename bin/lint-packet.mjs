// The objective half of critic-pacing, without a model: read the measurements in review/packet.md and report every
// number that breaks a limit the pacing critic's skill states. Run it before spending critics on a video (a critic round
// is about half a million tokens; this is milliseconds).
//   node bin/lint-packet.mjs <video folder> [--json]
// Prints findings, or with --json the object a critic returns (`critic`, `verdict`, `findings`). Exit 0 when nothing at
// major or above is found, 1 when something is, 2 when there is no packet (run `npm run review` first).
// It judges only what the packet measures: pace per scene, scene length, pauses, reading time, stillness. Whether the video
// is the right length for what it teaches, and anything about sync, stay with the critics.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { die, videoDir } from "./lib.mjs";

const LIMITS = { sceneOffPct: 15, sceneSeconds: 40, pauseSeconds: 2, stillMajor: 12, stillMinor: 8, gapMin: 0.25, sceneGapMin: 0.8, speedLow: 0.8, speedHigh: 1.6 };

export function parsePacket(text) {
  const head = text.match(/speed ([\d.]+): the target is about (\d+) syllables a minute/);
  const scenes = [...text.matchAll(/^### (\S+)\s+\(([\d.]+) s to ([\d.]+) s, (\d+) words; while speaking, (\d+) syllables a minute/gm)]
    .map((m) => ({ id: m[1], start: +m[2], end: +m[3], words: +m[4], syllables: +m[5] }));
  const section = (name) => (text.match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m")) || [])[1] || "";
  const pauses = [...section("Pauses").matchAll(/^\| ([\d.]+) \| ([\d.]+) \| (.+?) -> (.+?) \|$/gm)].map((m) => ({ at: +m[1], seconds: +m[2], from: m[3], to: m[4] }));
  const cues = [];
  for (const line of section("Cues").split("\n")) {
    const a = line.match(/^\| ([\d.]+) \| (\S+) \| `(.*?)` \|/);
    const b = line.match(/\| ([\d.]+) s \| ([\d.]+) s \| (.*?) \|\s*$/);
    if (a && b) cues.push({ at: +a[1], scene: a[2], cue: a[3], staysUp: +b[1], needs: +b[2], flag: b[3].trim() });
  }
  const stills = [...section("Stillness").matchAll(/^\| (\S+) \| ([\d.]+) \| ([\d.]+) s to ([\d.]+) s \|$/gm)].map((m) => ({ scene: m[1], seconds: +m[2], from: +m[3], to: +m[4] }));
  return { speed: head ? +head[1] : null, targetSyllables: head ? +head[2] : null, scenes, pauses, cues, stills };
}

export function lintPacket(text, limits = LIMITS) {
  const p = parsePacket(text);
  const f = [];
  const add = (id, severity, where, what, evidence, fix) => f.push({ id, severity, objective: true, where, what, evidence, fix });
  if (!p.scenes.length) throw new Error("no scenes found in the packet: has its format changed?");
  if (p.speed !== null && (p.speed < limits.speedLow || p.speed > limits.speedHigh)) add("lint-speed", "minor", "video.json", `The speed is ${p.speed}, outside ${limits.speedLow} to ${limits.speedHigh}.`, `packet header: speed ${p.speed}`, "Say once that it is unusual; the speed is the person's choice.");
  for (const s of p.scenes) {
    const off = p.targetSyllables ? ((s.syllables - p.targetSyllables) / p.targetSyllables) * 100 : 0;
    if (Math.abs(off) > limits.sceneOffPct) add(`lint-rate-${s.id}`, "major", `${s.id}, ${s.start} s to ${s.end} s`, `The scene runs ${s.syllables} syllables a minute against a target of ${p.targetSyllables}: ${Math.abs(off).toFixed(1)}% ${off > 0 ? "fast" : "slow"}.`, `packet, scene header of ${s.id}`, off > 0 ? "Fewer or plainer words in this scene; the speed is the person's choice." : "Tighten the scene or add a point to it.");
    if (s.end - s.start > limits.sceneSeconds) add(`lint-length-${s.id}`, "major", `${s.id}, ${s.start} s to ${s.end} s`, `The scene is ${(s.end - s.start).toFixed(1)} s long; over ${limits.sceneSeconds} s almost always holds two ideas.`, `packet, scene header of ${s.id}`, "Split it into two scenes.");
  }
  for (const q of p.pauses) {
    const end = q.to === "the end", scene = !end && q.from !== q.to && q.from !== "the start";
    if (!end && q.seconds > limits.pauseSeconds) add(`lint-pause-${q.at}`, "major", `${q.at} s`, `A pause of ${q.seconds} s (${q.from} to ${q.to}), more than ${limits.pauseSeconds} s anywhere but the end.`, "packet, Pauses table", "Shorten the gap in video.json (`gap`, `tail`, `lead`) or add something that happens.");
    if (!end && q.from !== "the start" && !scene && q.seconds < limits.gapMin) add(`lint-gap-${q.at}`, "minor", `${q.at} s`, `Sentences ${q.seconds} s apart: rushed (under ${limits.gapMin} s).`, "packet, Pauses table", "Lengthen `gap` in video.json.");
    if (scene && q.seconds < limits.sceneGapMin) add(`lint-scene-gap-${q.at}`, "minor", `${q.at} s`, `A scene change with ${q.seconds} s of breath (${q.from} to ${q.to}); under ${limits.sceneGapMin} s.`, "packet, Pauses table", "Lengthen `tail` in video.json.");
  }
  for (const c of p.cues) {
    if (/\bshort\b/.test(c.flag)) add(`lint-short-${c.at}`, "major", `${c.scene}, ${c.at} s, \`${c.cue}\``, `On-screen text leaves before it can be read: it stays up ${c.staysUp} s and needs ${c.needs} s.`, `packet, Cues table, flag "${c.flag}"`, "Cue it earlier, keep it up longer, or cut the text.");
    if (/\blate\b/.test(c.flag)) add(`lint-late-${c.at}`, "major", `${c.scene}, ${c.at} s, \`${c.cue}\``, `Reading in order, the text is not finished before its scene ends.`, `packet, Cues table, flag "${c.flag}"`, "Show less, or give the scene more time.");
  }
  for (const s of p.stills) {
    if (s.seconds > limits.stillMajor) add(`lint-still-${s.scene}`, "major", `${s.scene}, ${s.from} s to ${s.to} s`, `Nothing new appears for ${s.seconds} s while the voice goes on (over ${limits.stillMajor} s).`, "packet, Stillness table", "Add a cue (a highlight, a stagger, a count) inside the stretch.");
    else if (s.seconds > limits.stillMinor) add(`lint-still-${s.scene}`, "minor", `${s.scene}, ${s.from} s to ${s.to} s`, `Nothing new appears for ${s.seconds} s (over about ${limits.stillMinor} s: the viewer starts to drift).`, "packet, Stillness table", "Add a cue inside the stretch.");
  }
  const order = { blocking: 0, major: 1, minor: 2 };
  f.sort((a, b) => order[a.severity] - order[b.severity]);
  return { critic: "lint-packet", verdict: f.some((x) => x.severity !== "minor") ? "fail" : "pass", findings: f, measured: { scenes: p.scenes.length, cues: p.cues.length, pauses: p.pauses.length } };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith("-")) die("usage: node bin/lint-packet.mjs <video folder> [--json]");
  const dir = videoDir(args[0]);
  const file = join(dir, "review", "packet.md");
  if (!existsSync(file)) { console.error(`no ${file}: run npm run review -- ${args[0]} first`); process.exit(2); }
  let r;
  try { r = lintPacket(readFileSync(file, "utf8")); } catch (e) { console.error(`error: ${e.message}`); process.exit(2); }
  if (args.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`lint-packet: ${r.findings.length} finding(s) in ${r.measured.scenes} scenes, ${r.measured.cues} cues, ${r.measured.pauses} pauses`);
    for (const x of r.findings) console.log(`  ${x.severity.padEnd(5)} ${x.where}: ${x.what}\n        fix: ${x.fix}`);
    if (!r.findings.length) console.log("  nothing at a limit the packet measures; the critics still judge the rest");
  }
  process.exit(r.verdict === "fail" ? 1 : 0);
}
