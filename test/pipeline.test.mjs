// The parts that would go wrong quietly: a sentence split in the wrong place, a pronunciation
// swap that hits part of a word, a cue or caption at the wrong time. No Kokoro needed: the
// build test writes its own timing.json, as bin/voice.mjs would.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

test("a caption never ends on a function word, even when carrying it leaves a short line", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "kx-test-")), "demo");
  cpSync(join(REPO, "template"), dir, { recursive: true });
  // The comma ends the line at five words; "to," "a" and "the" all carry, leaving "First fish".
  writeFileSync(join(dir, "timing.json"), JSON.stringify({
    total: 9,
    scenes: [
      { id: "01-intro", start: 0, duration: 4, sentences: [{ text: "First fish the a to, then they swim away.", start: 0.5, duration: 3 }] },
      { id: "02-idea", start: 4, duration: 5, sentences: [
        { text: "A box appears when the voice says box.", start: 4.5, duration: 3 },
        // A whole run of function words before a comma has nothing to stay behind: it joins the next line.
        { text: "A to in of and, first they swim away.", start: 7.8, duration: 1 },
      ] },
    ],
  }));
  mkdirSync(join(dir, "assets"), { recursive: true });
  execFileSync(process.execPath, [join(REPO, "bin", "build.mjs"), dir]);
  const html = readFileSync(join(dir, "index.html"), "utf8");
  const caps = [...html.matchAll(/class="clip cap"[^>]*><span>([^<]*)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(caps.slice(0, 2), ["First fish", "the a to, then they swim away."]);
  assert.ok(caps.includes("A to in of and, first they swim away."), `a stranded line in ${JSON.stringify(caps)}`);
  for (const c of caps) assert.doesNotMatch(c, /\b(a|an|the|to|of|and|or|but|in|on|at|for|with|by|as|its|their|that)[.,]?$/i, `"${c}" ends on a function word`);
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
