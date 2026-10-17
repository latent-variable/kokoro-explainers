// The parts that would go wrong quietly: a sentence split in the wrong place, a pronunciation
// swap that hits part of a word, a cue or caption at the wrong time. No Kokoro needed: the
// build test writes its own timing.json, as bin/voice.mjs would.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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

test("the docs rule holds: both docs have content, every skill is listed, every critic is drawn, and the plugin names match", () => {
  const read = (f) => readFileSync(join(REPO, f), "utf8");
  const agents = read("AGENTS.md");
  assert.match(agents, /^## Docs that stay current$/m, "AGENTS.md lost its 'Docs that stay current' section");
  const docs = {};
  for (const f of ["docs/PRD.md", "docs/DESIGN.md"]) {
    assert.ok(existsSync(join(REPO, f)), `${f} is missing`);
    docs[f] = read(f);
    assert.ok(docs[f].length > 2000, `${f} is nearly empty`);
    assert.ok(agents.includes(f), `AGENTS.md does not name ${f}`);
  }
  assert.match(docs["docs/PRD.md"], /^Last reviewed: \d{4}-\d{2}-\d{2}/m, "docs/PRD.md has no 'Last reviewed' date");
  const names = readdirSync(join(REPO, "skills")).filter((n) => existsSync(join(REPO, "skills", n, "SKILL.md")));
  const rows = agents.split("\n").filter((l) => l.startsWith("|"));
  const inTable = (n) => rows.some((l) => l.includes("`" + n + "`"));
  assert.deepEqual(names.filter((n) => !inTable(n)), [], "skills missing from the AGENTS.md skills table");
  assert.deepEqual(names.filter((n) => !docs["docs/PRD.md"].includes(n)), [], "skills missing from docs/PRD.md");
  const svg = read("docs/assets/critics.svg");
  const critics = names.filter((n) => n.startsWith("critic-") && n !== "critic-loop").map((n) => n.slice(7));
  assert.deepEqual(critics.filter((c) => !svg.toLowerCase().includes(`>${c}<`)), [], "critics missing from docs/assets/critics.svg");
  const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
  const market = JSON.parse(read(".claude-plugin/marketplace.json"));
  assert.equal(plugin.name, "shipshow");
  assert.equal(market.plugins[0].name, plugin.name, "the marketplace entry and plugin.json names differ");
  assert.equal(plugin.version, undefined, "plugin.json must not set a version: the commit SHA versions the plugin (DESIGN D13)");
  assert.ok(existsSync(join(REPO, "agents", "critic.md")));
});

test("in CI, a change to code, skills or the plugin comes with a docs change or an explicit 'docs: no change'", { skip: !process.env.GITHUB_BASE_REF && "only checked on a pull request in CI" }, () => {
  const base = `origin/${process.env.GITHUB_BASE_REF}`;
  const git = (...a) => spawnSync("git", a, { cwd: REPO, encoding: "utf8" });
  const diff = git("diff", "--name-only", `${base}...HEAD`);
  if (diff.status !== 0) return; // no history to compare against: do not fail on a shallow checkout
  const files = diff.stdout.split("\n").filter(Boolean);
  const touchedCode = files.some((f) => /^(bin|kit|template|skills|agents|\.claude-plugin)\//.test(f));
  const touchedDocs = files.some((f) => f === "docs/PRD.md" || f === "docs/DESIGN.md");
  const msgs = git("log", "--format=%B", `${base}..HEAD`).stdout;
  assert.ok(!touchedCode || touchedDocs || /^docs: no change/m.test(msgs), "code, skills or plugin files changed but neither docs/PRD.md nor docs/DESIGN.md did; update them, or add a commit message line 'docs: no change'");
});

test("check-excerpt: real lines pass, and every way of faking them fails", async () => {
  const { checkExcerpt, parseRanges } = await import("../skills/critic-grounding/scripts/check-excerpt.mjs");
  const src = ["@login_required", "def add(doc):", "    if not search:", "        return", "", "    payload = {}", "    for f in fields:", "        payload[f] = 1", "    return payload", "", "def stub():", "    ...", ""].join("\n");
  const check = (ex, r, o) => checkExcerpt(src, ex, parseRanges(r), o);
  assert.equal(check("def add(doc):\n    if not search:\n        return\n", "2-4").ok, true);
  assert.equal(check("    payload = {}\n    for f in fields:\n", "6-7").ok, true);
  // a genuine excerpt that spans a blank line passes, whether or not the blank line is shown
  assert.equal(check("        return\n\n    payload = {}\n", "4-6").ok, true);
  assert.equal(check("        return\n    payload = {}\n", "4-6").ok, true);
  // a splice of non-adjacent lines, a changed token, and a dedent are all rejected
  assert.match(check("    payload = {}\n    payload[f] = 1\n", "6-8").problems[0], /not consecutive/);
  assert.match(check("    payload = []\n", "6-6").problems[0], /not consecutive/);
  assert.match(check("def add(doc):\nif not search:\n    return\n", "2-4").problems[0], /not consecutive/);
  // a stated range that is wrong, and a segment that matches in two places
  assert.match(check("    payload = {}\n", "5-5").problems[0], /stated range 5-5 but the text is at 6-6/);
  assert.match(check("    return payload\n", "4-4").problems[0], /stated range 4-4 but the text is at 9-9/);
  assert.equal(check("        return\n", "4-4").ok, true);
  // out of order
  assert.match(check("    return payload\n…\n    payload = {}\n", "9-9,6-6").problems[0], /out of order/);
  // nothing checked is a failure, and so are missing or mismatched ranges
  assert.match(check("", "1-1").problems[0], /empty/);
  assert.match(check("…\n…\n", "1-1").problems[0], /empty/);
  assert.match(checkExcerpt(src, "    payload = {}\n", null).problems[0], /--ranges is required/);
  assert.match(check("    payload = {}\n…\n    return payload\n", "6-6").problems[0], /2 segment/);
  // a literal `...` line is source text; only … is a marker unless asked
  assert.equal(check("def stub():\n    ...\n", "11-12").ok, true);
  assert.equal(check("def stub():\n    ...\n", "11-11,12-12", { asciiMarkers: true }).ok, false);
  // a gap is listed and flagged for a guard or an early exit, with a preview to read
  const g = check("def add(doc):\n    …\n    payload = {}\n", "2-2,6-6").gaps[0];
  assert.deepEqual([g.from, g.to, g.lines], [3, 5, 2]);
  assert.ok(["if", "not", "return"].every((f) => g.flags.includes(f)));
  assert.equal(g.preview[0], "if not search:");
  // a leading marker lists everything before the first segment, and a decorator is flagged
  const lead = check("…\n    payload = {}\n", "6-6");
  assert.equal(lead.ok, true);
  assert.ok(lead.gaps[0].flags.includes("@decorator"));
  assert.deepEqual(parseRanges("4, 6-7"), [[4, 4], [6, 7]]);
  assert.throws(() => parseRanges("4-"), /bad range/);
  // CRLF and a byte-order mark are not differences
  assert.equal(checkExcerpt("﻿a = 1\r\nb = 2\r\n", "a = 1\nb = 2\n", [[1, 2]]).ok, true);
});

test("check-excerpt CLI: runs from a path with a space or a symlink, and never exits 0 silently", () => {
  const root = mkdtempSync(join(tmpdir(), "kx-test-"));
  const script = join(REPO, "skills", "critic-grounding", "scripts", "check-excerpt.mjs");
  mkdirSync(join(root, "sp ace"));
  cpSync(script, join(root, "sp ace", "check-excerpt.mjs"));
  mkdirSync(join(root, "real"));
  cpSync(script, join(root, "real", "check-excerpt.mjs"));
  symlinkSync(join(root, "real"), join(root, "link"));
  writeFileSync(join(root, "s.py"), "a = 1\nb = 2\n");
  writeFileSync(join(root, "ok.txt"), "a = 1\nb = 2\n");
  writeFileSync(join(root, "bad.txt"), "a = 1\nb = 3\n");
  const run = (bin, ...args) => spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
  for (const bin of [script, join(root, "sp ace", "check-excerpt.mjs"), join(root, "link", "check-excerpt.mjs")]) {
    const ok = run(bin, join(root, "s.py"), join(root, "ok.txt"), "--ranges", "1-2");
    assert.equal(ok.status, 0, bin);
    assert.equal(JSON.parse(ok.stdout).ok, true, bin);
    const bad = run(bin, join(root, "s.py"), join(root, "bad.txt"), "--ranges", "1-2");
    assert.equal(bad.status, 1, bin);
    assert.equal(JSON.parse(bad.stdout).ok, false, bin);
  }
  assert.equal(run(script, join(root, "s.py"), join(root, "ok.txt")).status, 2);
  assert.equal(run(script, join(root, "missing"), join(root, "ok.txt"), "--ranges", "1-2").status, 2);
  assert.equal(run(script, join(root, "s.py"), join(root, "ok.txt"), "--ranges", "x").status, 2);
});

test("sandbox-run: no network, writes only inside the scratch directory, and it refuses where it cannot sandbox", { skip: process.platform !== "darwin" && "sandbox-exec is macOS only" }, () => {
  const sbx = join(REPO, "skills", "evidence-standard", "scripts", "sandbox-run.sh");
  const dir = mkdtempSync(join(tmpdir(), "kx-sbx-"));
  const run = (...cmd) => spawnSync(sbx, [dir, ...cmd], { encoding: "utf8" });
  assert.equal(run("sh", "-c", "echo ok > out.txt && cat out.txt").stdout.trim(), "ok");
  assert.equal(readFileSync(join(dir, "out.txt"), "utf8").trim(), "ok");
  assert.match(run("sh", "-c", "echo $HOME").stdout.trim(), /\.sandbox-home$/);
  assert.equal(run("sh", "-c", "echo x > /dev/null && echo fine").stdout.trim(), "fine");
  const outside = join(dirname(dir), `kx-escape-${process.pid}`);
  assert.notEqual(run("sh", "-c", `echo x > '${outside}'`).status, 0);
  assert.equal(existsSync(outside), false);
  assert.notEqual(run("sh", "-c", "echo x > ../kx-escape-rel").status, 0);
  assert.equal(existsSync(join(dirname(dir), "kx-escape-rel")), false);
  assert.notEqual(run("curl", "-sS", "-m", "5", "-o", "/dev/null", "https://example.com").status, 0);
  assert.equal(spawnSync(sbx, [], { encoding: "utf8" }).status, 2);
  assert.equal(spawnSync(sbx, [join(dir, "nope"), "true"], { encoding: "utf8" }).status, 2);
});
