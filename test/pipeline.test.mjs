// The parts that would go wrong quietly: a sentence split in the wrong place, a pronunciation
// swap that hits part of a word, a cue or caption at the wrong time. No Kokoro needed: the
// build test writes its own timing.json, as bin/voice.mjs would.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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

test("speed: --speed beats video.json beats local/config.json beats 1.25, and scales Kokoro's base pace", async () => {
  const { config, BASE_PACE, DEFAULT_SPEED } = await import("../bin/lib.mjs");
  const root = mkdtempSync(join(tmpdir(), "kx-test-"));
  const dir = join(root, "v"), local = join(root, "local");
  mkdirSync(dir); mkdirSync(local);
  process.env.SHIPSHOW_LOCAL = local;
  try {
    writeFileSync(join(dir, "video.json"), "{}");
    assert.equal(config(dir, []).speed, DEFAULT_SPEED);
    writeFileSync(join(local, "config.json"), JSON.stringify({ speed: 1.4 }));
    assert.equal(config(dir, []).speed, 1.4);
    writeFileSync(join(dir, "video.json"), JSON.stringify({ speed: 1.1 }));
    assert.equal(config(dir, []).speed, 1.1);
    const cli = config(dir, ["node", "voice.mjs", dir, "--speed", "1.5"]);
    assert.equal(cli.speed, 1.5);
    assert.equal(cli.kokoroSpeed, Math.round(BASE_PACE * 1.5 * 1000) / 1000);
    assert.equal(config(dir, ["--speed=0.9"]).speed, 0.9);
  } finally {
    delete process.env.SHIPSHOW_LOCAL;
  }
});

test("themes: a local theme wins over a shared one, its files are copied and its url()s rewritten", async () => {
  const { themeDir, themeCss } = await import("../bin/lib.mjs");
  const local = mkdtempSync(join(tmpdir(), "kx-test-"));
  mkdirSync(join(local, "themes", "shipshow", "fonts"), { recursive: true });
  writeFileSync(join(local, "themes", "shipshow", "theme.css"), ':root{--accent:#123456} @font-face{src:url("fonts/brand.woff2")} .l{background:url(./logo.svg)} .d{background:url(data:image/png;base64,AA)}');
  writeFileSync(join(local, "themes", "shipshow", "fonts", "brand.woff2"), "font");
  process.env.SHIPSHOW_LOCAL = local;
  try {
    assert.equal(themeDir("shipshow"), join(local, "themes", "shipshow"));
    const video = mkdtempSync(join(tmpdir(), "kx-test-"));
    const css = themeCss("shipshow", video);
    assert.match(css, /url\("assets\/theme\/fonts\/brand\.woff2"\)/);
    assert.match(css, /url\(assets\/theme\/logo\.svg\)/);
    assert.match(css, /url\(data:image\/png;base64,AA\)/);
    assert.equal(readFileSync(join(video, "assets", "theme", "fonts", "brand.woff2"), "utf8"), "font");
    assert.equal(themeDir("paper"), join(REPO, "themes", "paper"));
  } finally {
    delete process.env.SHIPSHOW_LOCAL;
  }
});

test("flair: a known token becomes a #root override; an unknown value stops the build", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  writeFileSync(join(dir, "timing.json"), JSON.stringify({
    total: 4,
    scenes: [
      { id: "01-intro", start: 0, duration: 2, sentences: [{ text: "This is the first scene.", start: 0.5, duration: 1 }] },
      { id: "02-idea", start: 2, duration: 2, sentences: [{ text: "A box appears when the voice says box.", start: 2.5, duration: 1 }] },
    ],
  }));
  const env = { ...process.env, SHIPSHOW_LOCAL: mkdtempSync(join(tmpdir(), "kx-test-")) };
  const vj = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
  writeFileSync(join(dir, "video.json"), JSON.stringify({ ...vj, flair: { transition: "zoom", ambient: "grid" } }));
  execFileSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir], { env, stdio: "pipe" });
  const html = readFileSync(join(dir, "index.html"), "utf8");
  assert.match(html, /#root \{\n  --transition: zoom;\n  --ambient: grid;\n\}/);
  assert.match(html, /--accent: #ffb454/);                       // the default theme, shipshow
  writeFileSync(join(dir, "video.json"), JSON.stringify({ ...vj, flair: { transition: "spin" } }));
  assert.throws(() => execFileSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir], { env, stdio: "pipe" }), /transition is "spin"/);
});

test("critic plan: presets, precedence, a decision video's defaults, and caps validated", async () => {
  const { reviewPlan, PRESETS } = await import("../bin/lib.mjs");
  const local = mkdtempSync(join(tmpdir(), "kx-test-"));
  process.env.SHIPSHOW_LOCAL = local;
  try {
    const plan = (cfg, argv = []) => reviewPlan({ title: "t", ...cfg }, argv);
    assert.equal(plan({}).preset, "standard");
    assert.equal(plan({}).rounds, PRESETS.standard.rounds);
    // A decision video defaults to quick and always gets critic-decision, which is also a floor.
    const d = plan({ kind: "decision" });
    assert.equal(d.preset, "quick");
    assert.ok(d.critics.includes("critic-decision"));
    assert.deepEqual(d.floor, ["critic-accuracy", "critic-decision"]);
    // local/config.json < video.json < flags
    writeFileSync(join(local, "config.json"), JSON.stringify({ review: { preset: "thorough", rounds: 3 } }));
    assert.equal(plan({}).preset, "thorough");
    assert.equal(plan({}).rounds, 3);
    assert.equal(plan({ review: { rounds: 2 } }).rounds, 2);
    assert.equal(plan({ review: { rounds: 2 } }, ["--rounds", "1"]).rounds, 1);
    assert.equal(plan({}, ["--preset", "quick"]).preset, "quick");
    assert.equal(plan({}, ["--final", "none"]).final, null);
    assert.deepEqual(plan({}, ["--critics", "critic-accuracy,critic-sync"]).critics, ["critic-accuracy", "critic-sync"]);
    // No list removes the floor: accuracy always runs, and a decision video's decision critic.
    assert.deepEqual(plan({}, ["--critics", "critic-sync"]).critics, ["critic-accuracy", "critic-sync"]);
    assert.deepEqual(plan({ kind: "decision" }, ["--critics", "critic-sync"]).critics, ["critic-accuracy", "critic-sync", "critic-decision"]);
    // A more specific preset resets less specific dials; a dial beside it still applies.
    assert.equal(plan({ review: { preset: "quick" } }).rounds, 1);
    assert.equal(plan({ review: { preset: "quick", rounds: 2 } }).rounds, 2);
    assert.equal(plan({}, ["--preset", "standard"]).rounds, PRESETS.standard.rounds);
    // More rounds never cost less.
    assert.ok(plan({}, ["--rounds", "4"]).estimate.worst > plan({}, ["--rounds", "1"]).estimate.worst);
  } finally {
    delete process.env.SHIPSHOW_LOCAL;
  }
  // Bad dials stop with a reason rather than being ignored.
  const bad = (args) => spawnSync(process.execPath, [join(REPO, "bin", "critics.mjs"), join(REPO, "videos", "how-it-works"), ...args], { encoding: "utf8", env: { ...process.env, SHIPSHOW_LOCAL: mkdtempSync(join(tmpdir(), "kx-test-")) } });
  assert.match(bad(["--rounds", "0"]).stderr, /rounds is 0/);
  assert.match(bad(["--until", "everything"]).stderr, /until is "everything"/);
  assert.match(bad(["--critics", "critic-vibes"]).stderr, /critic-vibes/);
  const typo = mkdtempSync(join(tmpdir(), "kx-test-"));
  writeFileSync(join(typo, "video.json"), JSON.stringify({ kind: "decison" }));
  assert.match(spawnSync(process.execPath, [join(REPO, "bin", "critics.mjs"), typo], { encoding: "utf8" }).stderr, /kind is "decison"/);
});

test("importance: the builder's call picks the preset; a person's explicit preset or flag beats it", async () => {
  const { reviewPlan, IMPORTANCE } = await import("../bin/lib.mjs");
  const local = mkdtempSync(join(tmpdir(), "kx-test-"));
  process.env.SHIPSHOW_LOCAL = local;
  try {
    const plan = (cfg, argv = []) => reviewPlan({ title: "t", ...cfg }, argv);
    for (const [level, preset] of Object.entries(IMPORTANCE)) assert.equal(plan({ importance: level }).preset, preset);
    assert.equal(plan({ importance: "high" }).presetFrom, "importance");
    // Beats a person's general default...
    writeFileSync(join(local, "config.json"), JSON.stringify({ review: { preset: "quick" } }));
    assert.equal(plan({ importance: "high" }).preset, "thorough");
    // ...but not a preset set on the video, or a flag in the moment.
    assert.equal(plan({ importance: "high", review: { preset: "standard" } }).preset, "standard");
    assert.equal(plan({ importance: "high" }, ["--preset", "quick"]).preset, "quick");
    // A decision video judged low still gets its decision critic.
    assert.ok(plan({ kind: "decision", importance: "low" }).critics.includes("critic-decision"));
  } finally {
    delete process.env.SHIPSHOW_LOCAL;
  }
  const bad = mkdtempSync(join(tmpdir(), "kx-test-"));
  writeFileSync(join(bad, "video.json"), JSON.stringify({ importance: "urgent" }));
  assert.match(spawnSync(process.execPath, [join(REPO, "bin", "critics.mjs"), bad], { encoding: "utf8" }).stderr, /importance is "urgent"/);
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

// Counts that appear in the docs are read from the tree, so a doc that quotes one goes stale loudly.
function treeFacts() {
  const names = readdirSync(join(REPO, "skills")).filter((n) => existsSync(join(REPO, "skills", n, "SKILL.md")));
  let chars = 0, longest = 0;
  for (const n of names) {
    const text = readFileSync(join(REPO, "skills", n, "SKILL.md"), "utf8");
    const m = text.match(/^description:\s*>?\s*\n((?:  .*\n)+)/m);
    chars += n.length + (m ? m[1].split("\n").map((l) => l.trim()).filter(Boolean).join(" ").length : 0);
    longest = Math.max(longest, text.split("\n").length - 1);
  }
  const critics = names.filter((n) => n.startsWith("critic-") && n !== "critic-loop");
  const tests = (readFileSync(join(REPO, "test", "pipeline.test.mjs"), "utf8").match(/^test\(/gm) || []).length;
  const word = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"][critics.length];
  return { names, critics, chars, longest, tests, word };
}

test("the docs rule holds: both docs have content, every skill is listed, every critic is drawn, the counts they quote are true, and the plugin names match", () => {
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
  const { names, critics, chars, longest, tests, word } = treeFacts();
  const rows = agents.split("\n").filter((l) => l.startsWith("|"));
  const inTable = (n) => rows.some((l) => l.includes("`" + n + "`"));
  assert.deepEqual(names.filter((n) => !inTable(n)), [], "skills missing from the AGENTS.md skills table");
  assert.deepEqual(names.filter((n) => !docs["docs/PRD.md"].includes(n)), [], "skills missing from docs/PRD.md");
  const svg = read("docs/assets/critics.svg").toLowerCase();
  assert.deepEqual(critics.filter((c) => !svg.includes(`>${c.slice(7)}<`)), [], "critics missing from docs/assets/critics.svg");
  // the numbers the docs quote must be the tree's numbers
  const budget = `${names.length} skills, ${chars.toLocaleString("en-US")} characters`;
  assert.ok(docs["docs/PRD.md"].includes(budget), `docs/PRD.md (N6) must say "${budget}"`);
  assert.ok(docs["docs/DESIGN.md"].includes(budget), `docs/DESIGN.md (D13) must say "${budget}"`);
  assert.ok(docs["docs/PRD.md"].includes(`longest SKILL.md ${longest} lines`), `docs/PRD.md (N6) must say "longest SKILL.md ${longest} lines"`);
  assert.ok(docs["docs/DESIGN.md"].includes(`longest ${longest}`), `docs/DESIGN.md (D13) must say "longest ${longest}"`);
  assert.ok(docs["docs/PRD.md"].includes(`${tests} tests`), `docs/PRD.md (N9) must say "${tests} tests"`);
  assert.ok(docs["docs/PRD.md"].includes(`Nine critics`.replace("Nine", word[0].toUpperCase() + word.slice(1))), `docs/PRD.md (F12) must say "${word[0].toUpperCase() + word.slice(1)} critics"`);
  assert.ok(docs["docs/DESIGN.md"].includes(`${word} critics`) || docs["docs/DESIGN.md"].includes(`${word[0].toUpperCase() + word.slice(1)} critics`), `docs/DESIGN.md must say "${word} critics"`);
  const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
  const market = JSON.parse(read(".claude-plugin/marketplace.json"));
  assert.equal(plugin.name, "shipshow");
  assert.equal(market.plugins[0].name, plugin.name, "the marketplace entry and plugin.json names differ");
  assert.equal(plugin.version, undefined, "plugin.json must not set a version: the commit SHA versions the plugin (DESIGN D13)");
  assert.ok(existsSync(join(REPO, "agents", "critic.md")));
  assert.match(plugin.description, new RegExp(`${word} adversarial critics`), "plugin.json's description must name the critic count");
});

test("in CI, a change to code, skills, the plugin, CI or the README comes with a real docs change, or 'docs: no change - <reason>'", { skip: !process.env.GITHUB_BASE_REF && "only checked on a pull request in CI" }, () => {
  const base = `origin/${process.env.GITHUB_BASE_REF}`;
  const git = (...a) => spawnSync("git", a, { cwd: REPO, encoding: "utf8" });
  const diff = git("diff", "--name-only", `${base}...HEAD`);
  if (diff.status !== 0) return; // no history to compare against: do not fail on a shallow checkout
  const files = diff.stdout.split("\n").filter(Boolean);
  const touchedCode = files.some((f) => /^(bin|kit|template|skills|agents|\.claude-plugin|\.github)\//.test(f) || f === "package.json" || f === "README.md");
  if (!touchedCode) return;
  // a docs change counts only if some changed line is not whitespace and not the "Last reviewed" date
  const hunk = git("diff", "-U0", `${base}...HEAD`, "--", "docs/PRD.md", "docs/DESIGN.md").stdout;
  const real = hunk.split("\n").filter((l) => /^[+-][^+-]/.test(l) && l.slice(1).trim() && !/^[+-]Last reviewed:/.test(l));
  const last = git("log", "-1", "--format=%B").stdout;
  const override = `${process.env.PR_TITLE || ""}\n${last}`.match(/^docs: no change - \S.{9,}/m);
  assert.ok(real.length > 0 || override, "code, skills or plugin files changed but docs/PRD.md and docs/DESIGN.md got no real change (whitespace and the 'Last reviewed' date do not count). Update them, or put 'docs: no change - <reason, at least ten characters>' in the PR title or the last commit message");
});

test("check-excerpt: real lines pass, and every way of faking them fails", async () => {
  const { checkExcerpt, parseRanges } = await import("../skills/critic-grounding/scripts/excerpt.mjs");
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
  // a statement shown inside a block it is not in: segments are checked against each other, not only each alone
  const nest = "def f(x):\n    if x:\n        a()\n    b()\n    return 1\n";
  assert.equal(checkExcerpt(nest, "if x:\n    …\nb()\n", [[2, 2], [4, 4]]).ok, true, "the same depth as the source passes");
  assert.match(checkExcerpt(nest, "if x:\n    …\n    b()\n", [[2, 2], [4, 4]]).problems[0], /indented differently/);
  assert.equal(checkExcerpt(nest, "    if x:\n        …\n    b()\n", [[2, 2], [4, 4]]).ok, true, "a uniform shift is fine");
  // a source that itself holds a marker-shaped line: warned, and a custom marker lets it be shown
  const odd = "a = 1\n# …\nb = 2\n";
  assert.equal(checkExcerpt(odd, "a = 1\n# …\nb = 2\n", [[1, 3]]).ok, false);
  assert.match(checkExcerpt(odd, "a = 1\n# …\nb = 2\n", [[1, 3]]).warnings[0], /marker-shaped/);
  assert.equal(checkExcerpt(odd, "a = 1\n# …\nb = 2\n", [[1, 3]], { marker: "[omitted]" }).ok, true);
  assert.equal(checkExcerpt(odd, "a = 1\n[omitted]\nb = 2\n", [[1, 1], [3, 3]], { marker: "[omitted]" }).ok, true);
  // a large source is handled; a huge excerpt is refused with a message; neither crashes
  const big = Array.from({ length: 200000 }, (_, i) => `x${i % 7} = ${i}`).join("\n");
  const t0 = Date.now();
  assert.equal(checkExcerpt(big, "x3 = 100003\nx4 = 100004\n", [[100004, 100005]]).ok, false); // 100003 % 7 is not 3
  assert.equal(checkExcerpt(big, "x0 = 0\nx1 = 1\n", [[1, 2]]).ok, true);
  assert.ok(Date.now() - t0 < 3000, "a 200,000-line source took too long");
  assert.match(checkExcerpt(big, big, [[1, 200000]]).problems[0], /more than 5000 lines/);
});

test("check-excerpt CLI: runs from a path with a space or a symlink, and never exits 0 silently", () => {
  const root = mkdtempSync(join(tmpdir(), "kx-test-"));
  const script = join(REPO, "skills", "critic-grounding", "scripts", "check-excerpt.mjs");
  const scripts = join(REPO, "skills", "critic-grounding", "scripts");
  mkdirSync(join(root, "sp ace"));
  cpSync(scripts, join(root, "sp ace"), { recursive: true });
  mkdirSync(join(root, "real"));
  cpSync(scripts, join(root, "real"), { recursive: true });
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
  // piped to node on stdin there is no script path; it must still not exit 0 without output
  const piped = spawnSync(process.execPath, ["-", join(root, "s.py"), join(root, "ok.txt"), "--ranges", "1-2"], { input: readFileSync(script), encoding: "utf8", cwd: join(root, "real") });
  assert.ok(piped.status !== 0 || piped.stdout.includes('"ok"'), "exited 0 with no output when piped to node");
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
  // it will not take $HOME, /, or a directory holding a .git as the scratch directory
  assert.equal(spawnSync(sbx, [process.env.HOME, "true"], { encoding: "utf8" }).status, 2);
  assert.equal(spawnSync(sbx, ["/", "true"], { encoding: "utf8" }).status, 2);
  mkdirSync(join(dir, "repo", ".git"), { recursive: true });
  assert.equal(spawnSync(sbx, [join(dir, "repo"), "true"], { encoding: "utf8" }).status, 2);
  // writes that go through system daemons are denied too: the preference store and the clipboard
  const domain = `com.shipshow.sandboxtest${process.pid}`;
  assert.notEqual(run("defaults", "write", domain, "k", "1").status, 0);
  assert.equal(existsSync(join(process.env.HOME, "Library", "Preferences", `${domain}.plist`)), false, "defaults wrote a preferences file outside the scratch directory");
  const clip = spawnSync("pbpaste", { encoding: "utf8" }).stdout;
  const copy = run("sh", "-c", "echo SHIPSHOW_SANDBOX_TEST | pbcopy");
  const after = spawnSync("pbpaste", { encoding: "utf8" }).stdout;
  if (after !== clip) spawnSync("pbcopy", { input: clip }); // put the person's clipboard back before failing
  assert.notEqual(copy.status, 0, "pbcopy ran inside the sandbox");
  assert.equal(after, clip, "the sandbox changed the clipboard");
});

test("the packet's reading time counts code in tokens, and finds the longest still stretch of a scene", async () => {
  const { readingSeconds, stillStretches, tokens, words } = await import("../bin/measure.mjs");
  const code = ".join(Author.followers.of_type(Follower), isouter=True) .where(sa.or_( Follower.id == self.id,";
  assert.equal(words(code), 9); // the old count: a code block passed the "short" check
  assert.equal(tokens(code), 15);
  assert.ok(readingSeconds(code) >= 9, "code needs about ten seconds, not three");
  assert.ok(Math.abs(readingSeconds("Ben posts and Ana reads it later today") - 8 / 3.3) < 0.01); // prose is unchanged
  assert.deepEqual(stillStretches({ start: 10, duration: 20 }, [12, 14, 28]), { seconds: 14, from: 14, to: 28 });
  assert.deepEqual(stillStretches({ start: 0, duration: 5 }, []), { seconds: 5, from: 0, to: 5 });
  assert.equal(stillStretches({ start: 0, duration: 10 }, [30, -3]).seconds, 10); // cues outside the scene are ignored
});

test("usage: a real-shape transcript is counted once per call, and the CLI runs from a path with a space or a symlink", () => {
  const fixture = join(REPO, "test", "fixtures", "real-subagent-usage.jsonl");
  const root = mkdtempSync(join(tmpdir(), "kx-test-"));
  mkdirSync(join(root, "sp ace"));
  cpSync(join(REPO, "bin"), join(root, "sp ace", "bin"), { recursive: true });
  symlinkSync(join(root, "sp ace", "bin"), join(root, "linkbin"));
  const run = (bin) => spawnSync(process.execPath, [bin, fixture, "--json"], { encoding: "utf8" });
  for (const bin of [join(REPO, "bin", "usage.mjs"), join(root, "sp ace", "bin", "usage.mjs"), join(root, "linkbin", "usage.mjs")]) {
    const r = run(bin);
    assert.equal(r.status, 0, `${bin}: ${r.stderr}`);
    const total = JSON.parse(r.stdout).total;
    // 14 usage lines are 8 distinct calls; expected values worked out from the file with a separate script
    assert.deepEqual(total, { calls: 8, input: 16, output: 76, cacheWrite: 39548, cacheRead: 266264 }, bin);
  }
  assert.notEqual(spawnSync(process.execPath, [join(REPO, "bin", "usage.mjs"), join(root, "nope.jsonl")], { encoding: "utf8" }).status, 0);
});

test("verify-vendored: MATCH only for the upstream tree with no edits and no untracked files, and it writes nothing into .git", () => {
  const script = join(REPO, "skills", "evidence-standard", "scripts", "verify-vendored.sh");
  const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...a], { cwd, encoding: "utf8" });
  const make = (withSource) => {
    const repo = mkdtempSync(join(tmpdir(), "kx-vend-"));
    git(repo, "init", "-q");
    mkdirSync(join(repo, "v", "sub"), { recursive: true });
    writeFileSync(join(repo, "v", "a.txt"), "alpha\n");
    writeFileSync(join(repo, "v", "sub", "b.txt"), "beta\n");
    if (withSource) writeFileSync(join(repo, "v", "SOURCE.md"), "upstream: example\n");
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "vendor v");
    return repo;
  };
  const upstream = git(make(false), "rev-parse", "HEAD:v").stdout.trim(); // the same files without SOURCE.md
  const repo = make(true);
  const run = (cwd, dir = "v", want = upstream) => spawnSync("sh", [script, dir, want], { cwd, encoding: "utf8" });
  const objects = () => git(repo, "count-objects").stdout;
  const before = objects();
  assert.equal(run(repo).status, 0);
  assert.match(run(repo).stdout, /MATCH/);
  assert.equal(run(join(repo, "v", "sub")).status, 0, "works from a subdirectory");
  assert.equal(objects(), before, "the check wrote an object into .git");
  assert.equal(run(repo, "v", "0".repeat(40)).status, 1);
  writeFileSync(join(repo, "v", "evil.py"), "x\n"); // untracked: the case a plain `git diff --quiet` misses
  assert.match(run(repo).stdout, /DIRTY/);
  assert.equal(run(repo).status, 1);
  assert.equal(run(mkdtempSync(join(tmpdir(), "kx-nogit-"))).status, 2);
});

test("capture: record keeps the command's own exit code, verify catches a changed byte, and a missing sidecar is unsupported", { skip: process.platform !== "darwin" && "record needs the macOS sandbox" }, () => {
  const cap = join(REPO, "skills", "evidence-standard", "scripts", "capture.mjs");
  const dir = mkdtempSync(join(tmpdir(), "kx-cap-"));
  const file = join(dir, "c.txt");
  const node = (...a) => spawnSync(process.execPath, [cap, ...a], { encoding: "utf8" });
  const rec = node("record", dir, file, "--", "sh", "-c", "echo hello; echo oops >&2; exit 3");
  assert.equal(rec.status, 0, rec.stderr);
  const text = readFileSync(file, "utf8");
  assert.match(text, /^# command: sh -c echo hello; echo oops >&2; exit 3$/m);
  assert.match(text, /^# exit: 3$/m); // 3 is also a code the sandbox script uses; it must not be mistaken for a refusal
  assert.ok(text.endsWith("\n---\nhello\noops\n"));
  assert.equal(node("verify", file).status, 0);
  writeFileSync(file, text.replace("\nhello\n", "\njello\n")); // the output, not the header
  assert.equal(node("verify", file).status, 1, "an altered capture must fail verification");
  writeFileSync(file, text.replace("# exit: 3", "# exit: 0")); // the header is covered too: a changed exit code is caught
  assert.equal(node("verify", file).status, 1);
  writeFileSync(file, text);
  assert.equal(node("verify", file).status, 0);
  assert.match(readFileSync(`${file}.sha256`, "utf8"), new RegExp(`^${createHash("sha256").update(text).digest("hex")}  c.txt`), "the sidecar is the plain SHA-256 of the whole file");
  assert.equal(node("verify", join(dir, "none.txt")).status, 2);
  writeFileSync(join(dir, "nosidecar.txt"), text);
  assert.equal(node("verify", join(dir, "nosidecar.txt")).status, 2);
  assert.equal(node("record", process.env.HOME, join(dir, "x.txt"), "--", "true").status, 2);
});

test("the sample application behaves as its README says: its tests pass, one known failure is a todo, and the scenario overspends", () => {
  const sample = join(REPO, "sample_application");
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // a child started under this runner would otherwise print nothing readable
  const tests = spawnSync(process.execPath, ["--test", ...readdirSync(join(sample, "test")).filter((f) => f.endsWith(".test.mjs")).map((f) => join("test", f))], { cwd: sample, encoding: "utf8", env });
  assert.equal(tests.status, 0, tests.stdout.slice(-600));
  assert.match(tests.stdout, /^# fail 0$/m);
  assert.match(tests.stdout, /^# todo 1$/m, "the budget contract test should be the one known failure, marked todo");
  const scenario = spawnSync(process.execPath, [join("scenario", "overspend.mjs")], { cwd: sample, encoding: "utf8" });
  assert.equal(scenario.status, 0, scenario.stderr);
  const percent = Object.fromEntries(scenario.stdout.split("\n").filter((l) => /\d+%/.test(l)).map((l) => [l.slice(0, 3).trim(), +l.match(/(\d+)%/)[1]]));
  assert.deepEqual(percent, { US: 111, EU: 93, Tok: 181 }, "the README's table and the scenario's output differ");
  const readme = readFileSync(join(sample, "README.md"), "utf8");
  for (const row of ["11,088 USD    111%", "8,585 EUR     93%", "27,122 JPY    181%"]) assert.ok(readme.includes(row), `the sample README no longer shows "${row}"`);
});

test("critic plan: a video that shows code gets critic-grounding on the floor, whatever the preset or critics list", async () => {
  const { reviewPlan, config } = await import("../bin/lib.mjs");
  const plan = (cfg, argv = []) => reviewPlan({ title: "t", ...cfg }, argv);
  assert.ok(!plan({}).critics.includes("critic-grounding"), "a video that shows no code does not need it");
  for (const preset of ["quick", "standard", "thorough"]) assert.ok(plan({ shows_code: true, review: { preset } }).critics.includes("critic-grounding"), preset);
  assert.ok(plan({ shows_code: true, review: { critics: ["critic-pacing"] } }).critics.includes("critic-grounding"), "a critics list cannot remove it");
  assert.ok(plan({ shows_code: true }).floor.includes("critic-grounding"));
  // read from scenes.html when video.json does not say
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  assert.equal(config(dir, []).shows_code, false);
  writeFileSync(join(dir, "scenes.html"), '<section data-scene="01-intro"><pre class="code">const x = 1;</pre></section>');
  assert.equal(config(dir, []).shows_code, true);
  const vj = JSON.parse(readFileSync(join(dir, "video.json"), "utf8"));
  writeFileSync(join(dir, "video.json"), JSON.stringify({ ...vj, shows_code: false }));
  assert.equal(config(dir, []).shows_code, false, "an explicit value in video.json wins");
});
