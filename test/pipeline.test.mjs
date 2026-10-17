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

test("a caption never ends on a function word, even when carrying it leaves a short line", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  // The comma ends the line at five words; "to," "a" and "the" all carry, leaving "First fish".
  writeFileSync(join(dir, "timing.json"), JSON.stringify({
    total: 11,
    scenes: [
      { id: "01-intro", start: 0, duration: 4, sentences: [{ text: "First fish the a to, then they swim away.", start: 0.5, duration: 3 }] },
      { id: "02-idea", start: 4, duration: 7, sentences: [
        { text: "A box appears when the voice says box.", start: 4.5, duration: 3 },
        // A whole run of function words before a comma has nothing to stay behind: it joins the next line.
        { text: "A to in of and, first they swim away.", start: 7.8, duration: 1 },
        // Twelve function words reach the line limit: the limit wins, and the line is kept whole.
        { text: "and or but of to in on at for with by as, then dogs bark loudly today.", start: 9, duration: 2 },
      ] },
    ],
  }));
  mkdirSync(join(dir, "assets"), { recursive: true });
  execFileSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir]);
  const html = readFileSync(join(dir, "index.html"), "utf8");
  const caps = [...html.matchAll(/class="clip cap"[^>]*><span>([^<]*)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(caps.slice(0, 2), ["First fish", "the a to, then they swim away."]);
  assert.ok(caps.includes("A to in of and, first they swim away."), `a stranded line in ${JSON.stringify(caps)}`);
  assert.ok(caps.includes("and or but of to in on at for with by as,") && caps.includes("then dogs bark loudly today."), `the 12-word limit was not kept in ${JSON.stringify(caps)}`);
  for (const c of caps) assert.ok(c.split(" ").length <= 12, `"${c}" is over 12 words`);
  // Only a line already at the 12-word limit may end on one (the limit wins, as above).
  for (const c of caps.filter((c) => c.split(" ").length < 12)) assert.doesNotMatch(c, /\b(a|an|the|to|of|and|or|but|in|on|at|for|with|by|as|its|their|that)[.,]?$/i, `"${c}" ends on a function word`);
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

test("syllables: rough but steady, so pace is judged by ear, not by word length", async () => {
  const { syllables } = await import("../bin/lib.mjs");
  assert.deepEqual(["each", "pull", "request", "understanding", "the", "make", "voice", "API"].map(syllables), [1, 1, 2, 4, 1, 1, 1, 2]);
  const per = (s) => s.split(" ").reduce((a, w) => a + syllables(w), 0) / s.split(" ").length;
  assert.ok(per("Each pull request waits on you") < per("Oversight and understanding of abstractions"));
});

test("music bed: lower under the voice than in the gaps, and silent where it fades out", async () => {
  const { musicBed } = await import("../bin/lib.mjs");
  const dir = mkdtempSync(join(tmpdir(), "kx-test-"));
  // A steady stereo tone, 48 kHz, 2 s, looped to 6 s.
  const rate = 48000, n = rate * 2, tone = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) tone[i * 2] = tone[i * 2 + 1] = Math.round(12000 * Math.sin((i / rate) * 2 * Math.PI * 220));
  writeWav(join(dir, "tone.wav"), { rate, channels: 2, samples: tone });
  const timing = { total: 6, scenes: [{ id: "a", start: 0, duration: 6, sentences: [{ text: "x", start: 3, duration: 1.5 }] }] };
  assert.equal(musicBed(dir, { file: "tone.wav", volume: 0.5, duck: 0.2 }, timing), true);
  const out = readWav(join(dir, "assets", "music.wav")).samples;
  const peak = (a, b) => { let m = 0; for (let f = Math.floor(a * rate); f < b * rate; f++) m = Math.max(m, Math.abs(out[f * 2])); return m; };
  const gap = peak(1.5, 2), speech = peak(3.5, 4);
  assert.ok(speech < gap * 0.3, `under speech ${speech} should be about a fifth of the gap ${gap}`);
  assert.ok(gap > 12000 * 0.5 * 0.9, "the gap plays at its volume");
  assert.ok(peak(5.99, 6) < gap * 0.01, "faded out at the end");
  assert.equal(musicBed(dir, { file: "missing.wav" }, timing), false);
});

// The omnivoice engine. The model itself needs a Mac and about 2 GB, so a fake worker stands in for
// bin/omnivoice.py: it writes a one-second tone per job and records the job file it was given.
const fakeLocal = () => {
  const local = mkdtempSync(join(tmpdir(), "kx-local-"));
  mkdirSync(join(local, "voices"));
  writeFileSync(join(local, "voices", "mine.wav"), "not really audio");
  writeFileSync(join(local, "voices", "mine.txt"), " The words in the clip. \n");
  return local;
};
const fakeWorker = () => {
  const path = join(mkdtempSync(join(tmpdir(), "kx-py-")), "python");
  writeFileSync(path, `#!${process.execPath}
import { appendFileSync, readFileSync } from "node:fs";
import { writeWav } from ${JSON.stringify(join(REPO, "bin", "lib.mjs"))};
const spec = JSON.parse(readFileSync(process.argv[3], "utf8"));
appendFileSync(process.argv[3] + ".log", JSON.stringify(spec) + "\\n");
for (const j of spec.jobs) writeWav(j.wav, { rate: 24000, channels: 1, samples: new Int16Array(24000) });
`, { mode: 0o755 });
  return path;
};
const voiceRun = (dir, local, py, ...args) => spawnSync(process.execPath, [join(REPO, "bin", "voice.mjs"), dir, ...args], {
  encoding: "utf8", env: { ...process.env, SHIPSHOW_LOCAL: local, HYPERFRAMES_PYTHON: py },
});
const newVideo = () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  return dir;
};

test("an omnivoice voice is a clone in local/voices or a built-in, and a replaced clip is a new voice", async () => {
  const { omniVoice, OMNI } = await import("../bin/lib.mjs?omni=1");
  const local = fakeLocal();
  process.env.SHIPSHOW_LOCAL = local;
  try {
    const clone = omniVoice("mine");
    assert.equal(clone.text, "The words in the clip.");
    assert.match(clone.identity, /^mine@[0-9a-f]{16}$/);
    writeFileSync(join(local, "voices", "mine.wav"), "another recording");
    assert.notEqual(omniVoice("mine").identity, clone.identity);
    assert.equal(omniVoice("caro_davy").identity, `caro_davy@${OMNI.voicesRevision}`);
    assert.equal(omniVoice("af_heart"), undefined, "a Kokoro voice is not an omnivoice one");
  } finally {
    delete process.env.SHIPSHOW_LOCAL;
  }
});

test("omnivoice voices only the stale sentences, and a different voice or speed voices them again", () => {
  const dir = newVideo(), local = fakeLocal(), py = fakeWorker();
  const jobsOf = () => readFileSync(join(dir, "assets", "omnivoice-jobs.json.log"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

  let r = voiceRun(dir, local, py, "--engine", "omnivoice");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(jobsOf().length, 1);
  assert.equal(jobsOf()[0].jobs.length, 4, "the template has four sentences");
  assert.equal(jobsOf()[0].voice.name, "caro_davy", "the template's Kokoro voice gives way to the engine's default");
  assert.equal(JSON.parse(readFileSync(join(dir, "timing.json"), "utf8")).engine, "omnivoice");

  r = voiceRun(dir, local, py, "--engine", "omnivoice");
  assert.match(r.stdout, /every sentence already voiced/);
  assert.equal(jobsOf().length, 1, "nothing went to the worker");

  r = voiceRun(dir, local, py, "--engine", "omnivoice", "--voice", "mine");
  const clone = jobsOf()[1];
  assert.equal(clone.jobs.length, 4, "a new voice re-voices every take");
  assert.equal(clone.voice.text, "The words in the clip.");
  assert.match(clone.voice.wav, /mine\.wav$/);

  voiceRun(dir, local, py, "--engine", "omnivoice", "--voice", "mine", "--speed", "1.1");
  assert.equal(jobsOf()[2].jobs.length, 4, "a new speed re-voices every take");
  assert.equal(jobsOf()[2].speed, 1.1);
});

test("omnivoice says what to do about a voice it does not have and a speed outside its range", () => {
  const dir = newVideo(), local = fakeLocal(), py = fakeWorker();
  let r = voiceRun(dir, local, py, "--engine", "omnivoice", "--voice", "nobody");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /no omnivoice voice "nobody".*caro_davy.*yours \(local\/voices\/\) are mine/s);
  // The documented route: engine set in video.json, on a template that names a Kokoro voice.
  const own = newVideo();
  const cfg = JSON.parse(readFileSync(join(own, "video.json"), "utf8"));
  writeFileSync(join(own, "video.json"), JSON.stringify({ ...cfg, engine: "omnivoice" }));
  r = voiceRun(own, local, py);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(readFileSync(join(own, "assets", "omnivoice-jobs.json.log"), "utf8").trim()).voice.name, "caro_davy");
  writeFileSync(join(own, "video.json"), JSON.stringify({ ...cfg, engine: "omnivoice", voice: "carro_davy" }));
  r = voiceRun(own, local, py);
  assert.notEqual(r.status, 0, "a typo in an omnivoice voice name is not swapped for the default");
  assert.match(r.stderr, /no omnivoice voice "carro_davy"/);
  r = voiceRun(dir, local, py, "--engine", "omnivoice", "--speed", "1.5");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /speed 1\.5 is outside 1 to 1\.3/);
  r = voiceRun(dir, local, py, "--engine", "mystery");
  assert.match(r.stderr, /engine is "mystery"; it takes kokoro or omnivoice/);
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
  assert.match(text, /^# command: \["sh","-c","echo hello; echo oops >&2; exit 3"\]$/m);
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
  // a newline in an argument cannot forge a header line, the delimiter or an exit status; quoting is kept
  const f2 = join(dir, "c2.txt");
  assert.equal(node("record", dir, f2, "--", "sh", "-c", 'echo "$0"', "x\n# exit: 0\n---\nfake").status, 0);
  const t2 = readFileSync(f2, "utf8");
  assert.equal(t2.split("\n").filter((l) => l === "---").length, 2, "one delimiter from the recorder, one echoed by the command's output");
  assert.match(t2.split("\n---\n")[0], /^# command: \[.*x\\n# exit: 0\\n---\\nfake"\]$/m);
  assert.match(t2, /^# exit: 0$/m);
  assert.match(t2.split("\n---\n")[0].split("\n").filter((l) => l.startsWith("# exit")).join("|"), /^# exit: 0$/, "exactly one exit line in the header");
  // an uppercase sidecar is the same hash; a directory or an unreadable sidecar is exit 2 with JSON, not a stack trace
  writeFileSync(`${f2}.sha256`, readFileSync(`${f2}.sha256`, "utf8").toUpperCase());
  assert.equal(node("verify", f2).status, 0);
  mkdirSync(join(dir, "adir"));
  writeFileSync(join(dir, "adir.sha256"), "x");
  const onDir = node("verify", join(dir, "adir"));
  assert.equal(onDir.status, 2);
  assert.doesNotThrow(() => JSON.parse(onDir.stdout));
  // nothing is run when the output directory is missing
  assert.equal(node("record", dir, join(dir, "nope", "c.txt"), "--", "true").status, 2);
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
  assert.equal(config(dir, []).shows_code, true, "code in the scenes counts even when video.json says false");
});

test("sandbox-run: a directory name cannot widen the profile, the real home stays protected without $HOME, and system roots are refused", { skip: process.platform !== "darwin" && "sandbox-exec is macOS only" }, () => {
  const sbx = join(REPO, "skills", "evidence-standard", "scripts", "sandbox-run.sh");
  const base = mkdtempSync(join(tmpdir(), "kx-sbx-"));
  const other = mkdtempSync(join(tmpdir(), "kx-sbx-other-"));
  // a name with a quote and a closing parenthesis, built to splice a second permission into a string profile
  const tricky = join(base, `t") (subpath "${other}`);
  mkdirSync(tricky, { recursive: true }); // the injected text holds a path, so this is nested directories
  const run = (dir, env, ...cmd) => spawnSync(sbx, [dir, ...cmd], { encoding: "utf8", env: env || process.env });
  assert.equal(run(tricky, null, "sh", "-c", "echo inside > f && cat f").stdout.trim(), "inside", "a directory with quotes in its name still works");
  assert.notEqual(run(tricky, null, "sh", "-c", `echo X > '${join(other, "inj")}'`).status, 0);
  assert.equal(existsSync(join(other, "inj")), false, "a quote in the directory name added write access elsewhere");
  // the credential denials follow the user database, not $HOME
  const noHome = { ...process.env }; delete noHome.HOME;
  const ssh = join(spawnSync("sh", ["-c", `dscl . -read /Users/$(id -un) NFSHomeDirectory | awk '{print $2}'`], { encoding: "utf8" }).stdout.trim(), ".ssh");
  if (existsSync(ssh)) assert.notEqual(run(base, noHome, "ls", ssh).status, 0, "~/.ssh was readable with HOME unset");
  for (const dir of ["/", "/tmp", "/Users", dirname(process.env.HOME), process.env.HOME]) assert.equal(spawnSync(sbx, [dir, "true"], { encoding: "utf8" }).status, 2, `${dir} must be refused`);
  assert.notEqual(run(base, null, "/usr/bin/open").status, 0, "open ran inside the sandbox");
  assert.equal(run(base, null, "env").stdout.split("\n").filter((l) => /^(PATH|LANG|HOME|TMPDIR)=/.test(l)).length >= 3, true);
  assert.equal(run(base, null, "env").stdout.split("\n").filter(Boolean).every((l) => /^(PATH|LANG|HOME|TMPDIR|PWD|SHLVL|_|OLDPWD|__CF_USER_TEXT_ENCODING)=/.test(l)), true, "the environment held more than PATH, LANG, HOME and TMPDIR");
});

test("verify-vendored: ignored files, assume-unchanged and skip-worktree are DIRTY, bad arguments are exit 2, and it does not touch .git/index", () => {
  const script = join(REPO, "skills", "evidence-standard", "scripts", "verify-vendored.sh");
  const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...a], { cwd, encoding: "utf8" });
  const repo = mkdtempSync(join(tmpdir(), "kx-vend2-"));
  git(repo, "init", "-q");
  mkdirSync(join(repo, "v"));
  writeFileSync(join(repo, "v", "a.py"), "a = 1\n");
  writeFileSync(join(repo, "v", "b.py"), "b = 2\n");
  writeFileSync(join(repo, ".gitignore"), "*.pyc\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "vendor v");
  const tree = git(repo, "rev-parse", "HEAD:v").stdout.trim();
  const run = (...a) => spawnSync("sh", [script, ...a], { cwd: repo, encoding: "utf8" });
  assert.equal(run("v", tree).status, 0);
  assert.equal(run("v", tree.toUpperCase()).status, 0, "an uppercase hash is the same hash");
  // bad usage is exit 2, never a git error code or a false MISMATCH
  for (const args of [["-v", tree], [":x", tree], ["", tree], ["v", "abc"], ["v", "zz".repeat(20)], ["v"]]) assert.equal(run(...args).status, 2, JSON.stringify(args));
  // the index is not rewritten by a check
  const idx = join(repo, ".git", "index");
  writeFileSync(join(repo, "v", "a.py"), "a = 1\n"); // same bytes, newer mtime: a plain `git status` would refresh the index
  const before = readFileSync(idx);
  assert.equal(run("v", tree).status, 0);
  assert.deepEqual(readFileSync(idx), before, "the check rewrote .git/index");
  // a gitignored file added inside the directory
  writeFileSync(join(repo, "v", "x.pyc"), "junk");
  assert.match(run("v", tree).stdout, /DIRTY/);
  assert.equal(run("v", tree).status, 1);
  writeFileSync(join(repo, "v", "x.pyc"), "junk"); // still there; remove it by overwriting nothing: check the next cases in a fresh repo
  const repo2 = mkdtempSync(join(tmpdir(), "kx-vend3-"));
  git(repo2, "init", "-q");
  mkdirSync(join(repo2, "v"));
  writeFileSync(join(repo2, "v", "a.py"), "a = 1\n");
  git(repo2, "add", "-A");
  git(repo2, "commit", "-q", "-m", "vendor v");
  const tree2 = git(repo2, "rev-parse", "HEAD:v").stdout.trim();
  const run2 = (...a) => spawnSync("sh", [script, ...a], { cwd: repo2, encoding: "utf8" });
  assert.equal(run2("v", tree2).status, 0);
  writeFileSync(join(repo2, "v", "a.py"), "a = 999\n");
  git(repo2, "update-index", "--assume-unchanged", "v/a.py"); // an edit git has been told to ignore
  assert.match(run2("v", tree2).stdout, /hidden from git/);
  assert.equal(run2("v", tree2).status, 1);
  git(repo2, "update-index", "--no-assume-unchanged", "v/a.py");
  git(repo2, "update-index", "--skip-worktree", "v/a.py");
  assert.equal(run2("v", tree2).status, 1);
});

test("check-excerpt CLI: a missing value for --ranges or --marker is an error, never a silent success", () => {
  const script = join(REPO, "skills", "critic-grounding", "scripts", "check-excerpt.mjs");
  const dir = mkdtempSync(join(tmpdir(), "kx-test-"));
  writeFileSync(join(dir, "s.py"), "a = 1\nb = 2\n");
  writeFileSync(join(dir, "e.txt"), "a = 1\n");
  const run = (...a) => spawnSync(process.execPath, [script, ...a], { encoding: "utf8" });
  assert.equal(run(join(dir, "s.py"), join(dir, "e.txt"), "--ranges", "1-1", "--marker").status, 2);
  assert.equal(run(join(dir, "s.py"), join(dir, "e.txt"), "--ranges").status, 2);
  assert.equal(run(join(dir, "s.py"), join(dir, "e.txt"), "--ranges", "--marker", "x").status, 2);
  // (A closed stdout cannot be detected: Node reopens it as /dev/null at startup. "No output is not a pass" is
  // the rule in skills/critic-grounding, and this test does not pretend otherwise.)
});

test("every script a skill names exists at the path the skill gives, and no skill uses a bare relative scripts/ path", () => {
  const skills = readdirSync(join(REPO, "skills")).filter((n) => existsSync(join(REPO, "skills", n, "SKILL.md")));
  const files = [...skills.map((n) => ["skills/" + n + "/SKILL.md", n]), ...(existsSync(join(REPO, "agents", "critic.md")) ? [["agents/critic.md", null]] : [])];
  let found = 0;
  for (const [rel, own] of files) {
    let text = readFileSync(join(REPO, rel), "utf8");
    const resolveTo = [];
    // the three forms that resolve: this skill's own, a sibling's, and from the repo root or an installed plugin root
    text = text.replace(/\$\{CLAUDE_SKILL_DIR\}\/\.\.\/([\w-]+)\/scripts\/([\w.-]+)/g, (_, skill, f) => (resolveTo.push(["skills", skill, "scripts", f]), ""));
    text = text.replace(/\$\{CLAUDE_SKILL_DIR\}\/scripts\/([\w.-]+)/g, (_, f) => (resolveTo.push(["skills", own || "?", "scripts", f]), ""));
    text = text.replace(/(?:\$\{CLAUDE_PLUGIN_ROOT\}\/)?skills\/([\w-]+)\/scripts\/([\w.-]+)/g, (_, skill, f) => (resolveTo.push(["skills", skill, "scripts", f]), ""));
    for (const parts of resolveTo) { found++; assert.ok(existsSync(join(REPO, ...parts)), `${rel} names ${parts.join("/")}, which does not exist`); }
    const bare = text.match(/(?<![\w/.-])scripts\/[\w.-]+\.(?:mjs|sh)\b/g);
    assert.equal(bare, null, `${rel} calls ${bare && bare[0]} by a bare relative path; use \${CLAUDE_SKILL_DIR}/scripts/... or the full skills/<name>/scripts/... path`);
  }
  assert.ok(found >= 6, "the check found almost no script paths: has the path form changed?");
});

test("capture: a sandboxed command cannot redirect the host-side write with a symlink, and a command that never ran is not recorded", { skip: process.platform !== "darwin" && "record needs the macOS sandbox" }, () => {
  const cap = join(REPO, "skills", "evidence-standard", "scripts", "capture.mjs");
  const node = (...a) => spawnSync(process.execPath, [cap, ...a], { encoding: "utf8" });
  const dir = mkdtempSync(join(tmpdir(), "kx-cap2-"));
  const victim = join(mkdtempSync(join(tmpdir(), "kx-victim-")), "victim.txt");
  writeFileSync(victim, "VICTIM ORIGINAL\n");
  // the command plants a symlink at the capture path and at its sidecar path, inside the scratch directory
  const file = join(dir, "out.txt");
  const r = node("record", dir, file, "--", "/bin/sh", "-c", `ln -s '${victim}' out.txt; ln -s '${victim}' out.txt.sha256; echo pwned`);
  assert.equal(readFileSync(victim, "utf8"), "VICTIM ORIGINAL\n", "the capture write followed a planted symlink");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(file, "utf8").includes("pwned"), true, "the capture file was replaced by a regular file");
  assert.equal(node("verify", file).status, 0);
  // a directory swapped for a symlink while the command ran: refused, nothing written through it
  const sub = join(dir, "sub");
  mkdirSync(sub);
  const outside = mkdtempSync(join(tmpdir(), "kx-outside-"));
  const swapped = node("record", dir, join(sub, "c.txt"), "--", "/bin/sh", "-c", `rmdir sub && ln -s '${outside}' sub`);
  assert.equal(swapped.status, 2, swapped.stdout + swapped.stderr);
  assert.deepEqual(readdirSync(outside), [], "something was written through the swapped directory");
  // a command that is not there, one that starts with a dash, or one that kills its shell: exit 2, no capture
  const none = join(dir, "none.txt");
  assert.equal(node("record", dir, none, "--", "/no/such/command").status, 2);
  assert.equal(node("record", dir, none, "--", "-x").status, 2);
  assert.equal(existsSync(none), false, "a capture was written for a command that never ran");
  // the sandbox denies signalling other processes, so a command cannot kill its own shell to hide its status:
  // it fails with its own exit code, which is recorded as it is
  assert.equal(node("record", dir, none, "--", "/bin/sh", "-c", "kill -9 $PPID").status, 0);
  assert.match(readFileSync(none, "utf8"), /^# exit: 1$/m);
});

test("sandbox-run: no controlling terminal, so a command cannot type into the caller's shell; other processes cannot be signalled; risky scratch directories are refused", { skip: process.platform !== "darwin" && "sandbox-exec is macOS only" }, () => {
  const sbx = join(REPO, "skills", "evidence-standard", "scripts", "sandbox-run.sh");
  const dir = mkdtempSync(join(tmpdir(), "kx-sbx-"));
  const probe = join(dir, "sti.py");
  writeFileSync(probe, "import fcntl, os, sys, termios\ntry:\n    fd = os.open('/dev/tty', os.O_RDWR)\n    fcntl.ioctl(fd, termios.TIOCSTI, b'x')\n    print('INJECTED'); sys.exit(0)\nexcept OSError as e:\n    print('blocked:', e.strerror); sys.exit(3)\n");
  const underPty = (...cmd) => spawnSync("python3", ["-c", "import pty, sys; sys.exit(pty.spawn(sys.argv[1:]) >> 8)", ...cmd], { encoding: "utf8" });
  const control = underPty("python3", probe); // the same probe, unsandboxed, under a pty: this is what the fix prevents
  assert.match(control.stdout, /INJECTED/, "the control did not inject, so this test proves nothing here");
  const boxed = underPty(sbx, dir, "python3", probe);
  assert.doesNotMatch(boxed.stdout, /INJECTED/, "a sandboxed command typed into the controlling terminal");
  assert.equal(boxed.status, 3);
  // another process cannot be signalled
  assert.notEqual(spawnSync(sbx, [dir, "sh", "-c", `kill -0 ${process.pid}`], { encoding: "utf8" }).status, 0, "a sandboxed command could signal another process");
  // refused scratch directories, each without creating a stray .sandbox-home
  const home = spawnSync("sh", ["-c", "dscl . -read /Users/$(id -un) NFSHomeDirectory | awk '{print $2}'"], { encoding: "utf8" }).stdout.trim();
  for (const bad of [join(home, ".ssh"), join(home, "Library"), join(home, "Library", "LaunchAgents"), "/Users/Shared", `/System/Volumes/Data${home}`]) {
    if (!existsSync(bad)) continue;
    assert.equal(spawnSync(sbx, [bad, "true"], { encoding: "utf8" }).status, 2, `${bad} must be refused`);
    assert.equal(existsSync(join(bad, ".sandbox-home")), false, `${bad} got a stray .sandbox-home`);
  }
  assert.equal(spawnSync(sbx, [dir, "-p", "x"], { encoding: "utf8" }).status, 2, "a command starting with a dash is refused");
  mkdirSync(join(dir, "-x"));
  assert.equal(spawnSync(sbx, ["-x", "true"], { cwd: dir, encoding: "utf8" }).status, 0, "a scratch directory named -x works");
});

test("verify-vendored: repo-local git settings cannot hide an edit (fsmonitor, submodule ignore), a hook is never run, and a linked worktree works", () => {
  const script = join(REPO, "skills", "evidence-standard", "scripts", "verify-vendored.sh");
  const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "protocol.file.allow=always", ...a], { cwd, encoding: "utf8" });
  const repo = mkdtempSync(join(tmpdir(), "kx-vend4-"));
  git(repo, "init", "-q");
  const sub = mkdtempSync(join(tmpdir(), "kx-sub-"));
  git(sub, "init", "-q");
  writeFileSync(join(sub, "f.txt"), "sub\n");
  git(sub, "add", "-A");
  git(sub, "commit", "-q", "-m", "sub");
  mkdirSync(join(repo, "v"));
  writeFileSync(join(repo, "v", "a.py"), "a = 1\n");
  git(repo, "add", "-A");
  git(repo, "submodule", "add", "-q", sub, "v/sm");
  git(repo, "commit", "-q", "-m", "vendor v");
  const tree = git(repo, "rev-parse", "HEAD:v").stdout.trim();
  const run = (cwd = repo) => spawnSync("sh", [script, "v", tree], { cwd, encoding: "utf8" });
  assert.equal(run().status, 0, run().stdout);
  // a core.fsmonitor hook: it must never run, and an edit must not be hidden by it
  const marker = join(repo, "hook-ran");
  git(repo, "config", "core.fsmonitor", `touch '${marker}'; true`);
  assert.equal(run().status, 0);
  assert.equal(existsSync(marker), false, "the fsmonitor hook ran");
  git(repo, "config", "--unset", "core.fsmonitor");
  // a submodule marked ignore=all hides an edit inside it from plain git status
  git(repo, "config", "submodule.v/sm.ignore", "all");
  writeFileSync(join(repo, "v", "sm", "f.txt"), "EVIL\n");
  assert.equal(git(repo, "status", "--porcelain").stdout.includes("v/sm"), false, "the setup did not hide the edit from plain git status");
  assert.match(run().stdout, /DIRTY/);
  assert.equal(run().status, 1);
  // a linked worktree has no objects of its own: the check must still work from it
  const repo2 = mkdtempSync(join(tmpdir(), "kx-vend5-"));
  git(repo2, "init", "-q");
  mkdirSync(join(repo2, "v"));
  writeFileSync(join(repo2, "v", "a.py"), "a = 1\n");
  git(repo2, "add", "-A");
  git(repo2, "commit", "-q", "-m", "vendor v");
  const tree2 = git(repo2, "rev-parse", "HEAD:v").stdout.trim();
  const wt = join(mkdtempSync(join(tmpdir(), "kx-wt-")), "wt");
  git(repo2, "worktree", "add", "-q", wt);
  assert.equal(spawnSync("sh", [script, "v", tree2], { cwd: wt, encoding: "utf8" }).status, 0);
});

test("extract-excerpts: the text a viewer sees, without highlight spans or entities, ready for check-excerpt", () => {
  const dir = mkdtempSync(join(tmpdir(), "kx-test-"));
  const html = `<section data-scene="01-intro"><h1>x</h1></section>
<section data-scene="03-batching">
  <pre class="ss-code" data-source="src/ledger.mjs" data-ranges="2-3,5-5">
<span class="k">export</span> function f(a, b) {
  if (a &gt;= b) { return a &amp;&amp; b; }
</span>…
  return "ok";
}</pre>
  <div class="ss-code"><div>nested</div> line two &rarr; end</div>
</section>`;
  writeFileSync(join(dir, "scenes.html"), html);
  const out = join(dir, "out");
  const run = spawnSync(process.execPath, [join(REPO, "skills", "critic-grounding", "scripts", "extract-excerpts.mjs"), join(dir, "scenes.html"), out], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const list = JSON.parse(run.stdout);
  assert.equal(list.length, 2);
  assert.deepEqual([list[0].scene, list[0].source, list[0].ranges], ["03-batching", "src/ledger.mjs", "2-3,5-5"]);
  assert.equal(readFileSync(list[0].file, "utf8"), 'export function f(a, b) {\n  if (a >= b) { return a && b; }\n…\n  return "ok";\n}');
  assert.equal(readFileSync(list[1].file, "utf8"), "nested line two \u2192 end", "&rarr; is the arrow the viewer sees, not ->");
  assert.match(list[0].check, /check-excerpt\.mjs .* --ranges 2-3,5-5/);
  // no code shown: exit 1; bad usage: exit 2
  writeFileSync(join(dir, "none.html"), "<section data-scene=\"01\"><p>hi</p></section>");
  assert.equal(spawnSync(process.execPath, [join(REPO, "skills", "critic-grounding", "scripts", "extract-excerpts.mjs"), join(dir, "none.html"), join(dir, "o2")], { encoding: "utf8" }).status, 1);
  assert.equal(spawnSync(process.execPath, [join(REPO, "skills", "critic-grounding", "scripts", "extract-excerpts.mjs")], { encoding: "utf8" }).status, 2);
});
