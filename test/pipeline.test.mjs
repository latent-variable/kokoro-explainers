// The parts that would go wrong quietly: a sentence split in the wrong place, a pronunciation
// swap that hits part of a word, a cue or caption at the wrong time. No Kokoro needed: the
// build test writes its own timing.json, as bin/voice.mjs would.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { REPO, outName, readWav, sentences, spoken, writeWav } from "../bin/lib.mjs";

test("sentences end at . ! or ? and a space, not inside a number or a file name", () => {
  assert.deepEqual(sentences("It costs 3.5 dollars. Open index.html now! Ready?  Yes."), [
    "It costs 3.5 dollars.", "Open index.html now!", "Ready?", "Yes.",
  ]);
});

test("say swaps whole words only", () => {
  const say = { MP4: "M P 4", HyperFrames: "Hyper Frames" };
  assert.equal(spoken("An MP4, drawn by HyperFrames.", say), "An M P 4, drawn by Hyper Frames.");
  assert.equal(spoken("MP4s and HyperFramesJS stay as written.", say), "MP4s and HyperFramesJS stay as written.");
});

test("a WAV survives a write and a read", () => {
  const path = join(mkdtempSync(join(tmpdir(), "kx-test-")), "a.wav");
  const samples = Int16Array.from([0, 1, -1, 32767, -32768]);
  writeWav(path, { rate: 24000, channels: 1, samples });
  const back = readWav(path);
  assert.equal(back.rate, 24000);
  assert.deepEqual([...back.samples], [...samples]);
});

test("build puts each cue on its word and each caption on its sentence", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  // Scene two: "This is the second scene." 2.0-4.0 s, then "A box appears when the voice says box." 4.5-7.5 s.
  writeFileSync(join(dir, "timing.json"), JSON.stringify({
    total: 9,
    scenes: [
      { id: "01-intro", start: 0, duration: 4, sentences: [{ text: "This is the first scene. Each sentence is voiced on its own.", start: 0.5, duration: 3 }] },
      { id: "02-idea", start: 4, duration: 5, sentences: [
        { text: "This is the second scene.", start: 4.5, duration: 2 },
        { text: "A box appears when the voice says box.", start: 7, duration: 1.5 },
      ] },
    ],
  }));
  mkdirSync(join(dir, "assets"), { recursive: true });
  execFileSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir]);
  const html = readFileSync(join(dir, "index.html"), "utf8");

  // "box#2" is the last word: 27 of the sentence's 31 letters in, so 7 + 27/31 * 1.5, less the 0.15 s lead.
  const at = +html.match(/data-cue="box#2" data-at="([\d.]+)"/)[1];
  assert.equal(at, Math.round((7 + (27 / 31) * 1.5 - 0.15) * 100) / 100);
  assert.match(html, /data-cue="\+0.2" data-at="4.2"/);
  assert.match(html, /id="scene-02-idea" class="clip scene" data-start="4" data-duration="4.99"/);
  assert.match(html, /data-start="7" data-duration="[\d.]+" data-track-index="20"><span>A box appears when the voice says box.<\/span>/);
});

test("build stops on a cue word the scene never says", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  writeFileSync(join(dir, "scenes.html"), readFileSync(join(dir, "scenes.html"), "utf8").replace('data-cue="box#2"', 'data-cue="giraffe"'));
  writeFileSync(join(dir, "timing.json"), JSON.stringify({
    total: 4,
    scenes: [
      { id: "01-intro", start: 0, duration: 2, sentences: [{ text: "This is the first scene.", start: 0.5, duration: 1 }] },
      { id: "02-idea", start: 2, duration: 2, sentences: [{ text: "A box appears.", start: 2.5, duration: 1 }] },
    ],
  }));
  assert.throws(() => execFileSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir], { stdio: "pipe" }), /giraffe/);
});

test("build warns when a bare cue word occurs more than once in its scene", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  writeFileSync(join(dir, "scenes.html"), readFileSync(join(dir, "scenes.html"), "utf8").replace('data-cue="box#2"', 'data-cue="box"'));
  writeFileSync(join(dir, "timing.json"), JSON.stringify({
    total: 4,
    scenes: [
      { id: "01-intro", start: 0, duration: 2, sentences: [{ text: "This is the first scene.", start: 0.5, duration: 1 }] },
      { id: "02-idea", start: 2, duration: 2, sentences: [{ text: "A box appears when the voice says box.", start: 2.5, duration: 1 }] },
    ],
  }));
  const r = spawnSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /data-cue="box" matches 2 words/);
});

test("skills link from skills/ and local/skills/, and a local one cannot shadow a shared one", async () => {
  const { readlinkSync } = await import("node:fs");
  const root = mkdtempSync(join(tmpdir(), "kx-test-"));
  for (const d of ["skills/explainer-video", "local/skills/critic-mine", "local/skills/explainer-video"]) {
    mkdirSync(join(root, d), { recursive: true });
    writeFileSync(join(root, d, "SKILL.md"), "---\nname: x\n---\n");
  }
  const r = spawnSync(process.execPath, [join(REPO, "bin", "link-skills.mjs"), root], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.equal(readlinkSync(join(root, ".claude/skills/explainer-video")), join("..", "..", "skills", "explainer-video"));
  assert.equal(readlinkSync(join(root, ".claude/skills/critic-mine")), join("..", "..", "local", "skills", "critic-mine"));
  assert.match(r.stderr, /local\/skills\/explainer-video has the same name as a shared skill/);
});

test("renders of two folders that share a name do not overwrite each other", () => {
  assert.equal(outName(join(REPO, "videos", "how-it-works")), "how-it-works");
  assert.notEqual(outName(join(REPO, "local", "videos", "a", "demo")), outName(join(REPO, "local", "videos", "b", "demo")));
});

test("usage counts each API call once, and sums the session with its subagents", async () => {
  const { readSession } = await import("../bin/usage.mjs");
  const root = mkdtempSync(join(tmpdir(), "kx-test-"));
  const line = (id, u, ts) => JSON.stringify({ type: "assistant", timestamp: ts, message: { id, model: "m", usage: u } });
  const u = (i, o, w, r) => ({ input_tokens: i, output_tokens: o, cache_creation_input_tokens: w, cache_read_input_tokens: r });
  // msg_a is streamed over two lines: the second, with the final output count, is the one that counts.
  writeFileSync(join(root, "s.jsonl"), [
    line("msg_a", u(2, 10, 100, 0), "2026-10-17T10:00:00Z"),
    line("msg_a", u(2, 50, 100, 0), "2026-10-17T10:00:01Z"),
    line("msg_b", u(1, 5, 0, 300), "2026-10-17T10:00:10Z"),
    "not json",
  ].join("\n"));
  mkdirSync(join(root, "s", "subagents"), { recursive: true });
  writeFileSync(join(root, "s", "subagents", "agent-abc123456.jsonl"), line("msg_c", u(3, 7, 0, 40), "2026-10-17T10:00:05Z"));
  const [main, sub] = readSession(join(root, "s.jsonl"));
  assert.deepEqual([main.calls, main.output, main.cacheWrite, main.cacheRead], [2, 55, 100, 300]);
  assert.equal(main.peakContext, 301);
  assert.equal(main.lastContext, 301);
  assert.deepEqual([sub.name, sub.calls, sub.output, sub.peakContext], ["abc12345", 1, 7, 43]);
});

test("the PRD and design docs exist, AGENTS.md names them, and every skill is in its skills table", () => {
  const agents = readFileSync(join(REPO, "AGENTS.md"), "utf8");
  for (const f of ["docs/PRD.md", "docs/DESIGN.md"]) {
    assert.ok(existsSync(join(REPO, f)), `${f} is missing`);
    assert.ok(agents.includes(f), `AGENTS.md does not name ${f}`);
  }
  const listed = (name) => agents.includes("`" + name + "`");
  const skills = readdirSync(join(REPO, "skills")).filter((n) => existsSync(join(REPO, "skills", n, "SKILL.md")));
  assert.deepEqual(skills.filter((n) => !listed(n)), [], "skills missing from the AGENTS.md skills table");
});

test("check-excerpt accepts real lines, rejects a splice or a changed token, and flags a guard hidden in a gap", async () => {
  const { checkExcerpt } = await import("../skills/critic-grounding/scripts/check-excerpt.mjs");
  const src = ["def add(doc):", "    if not search:", "        return", "    payload = {}", "    for f in fields:", "        payload[f] = 1", "    index(payload)", ""].join("\n");
  assert.equal(checkExcerpt(src, "    payload = {}\n    for f in fields:\n", "4-5").ok, true);
  assert.match(checkExcerpt(src, "    payload = {}\n    index(payload)\n").problems[0], /not consecutive/);
  assert.match(checkExcerpt(src, "    payload = []\n").problems[0], /not consecutive|segment 1/);
  assert.match(checkExcerpt(src, "    index(payload)\n    payload = {}\n").problems[0], /out of order|not consecutive/);
  const trimmed = checkExcerpt(src, "def add(doc):\n    …\n    payload = {}\n");
  assert.equal(trimmed.ok, true);
  assert.deepEqual(trimmed.gaps[0].flags.sort(), ["if", "not", "return"]);
  assert.match(checkExcerpt(src, "payload = {}\n", "3-3").problems[0], /differ/);
});
