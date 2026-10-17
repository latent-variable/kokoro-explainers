// Write a video's HyperFrames composition from its scenes, script and voice timing.
//   node bin/build.mjs videos/<name>          (run bin/voice.mjs first)
// Reads scenes.html: a <style>, one <section data-scene="<script file name>"> per scene, and
// optionally a <script> that adds to the timeline. Inside a scene, an element with
//   data-cue="word"     arrives when the voice says the first word starting with "word"
//   data-cue="word#2"   ... the second one
//   data-cue="+1.5"     ... 1.5 s into the scene
// and data-anim says how (kit/kit.js); a section's data-transition and data-camera override the
// theme's. The look is the theme (video.json "theme", themes/ or local/themes/) under the
// video's own styles, and video.json "flair" overrides the theme's motion. Captions are the
// script's own words, one line at a time. Writes index.html, meta.json, assets/vendor/gsap.min.js
// and assets/theme/ (the theme's fonts and images).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { REPO, config, die, flairCss, musicBed, norm, round, seedFor, themeCss, videoDir } from "./lib.mjs";

const CUE_LEAD = 0.15;      // a piece lands just before its word, so the eye gets there with the ear
const LINE_WORDS = 12;      // the longest caption line
const WEAK = new Set(["a", "an", "the", "to", "of", "and", "or", "but", "in", "on", "at", "for", "with", "by", "as", "its", "their", "that"]); // never the last word of a line

const dir = videoDir(process.argv[2]);
const cfg = config(dir);
if (!existsSync(join(dir, "timing.json"))) die("no timing.json yet: node bin/voice.mjs first");
const timing = JSON.parse(readFileSync(join(dir, "timing.json"), "utf8"));
const byId = Object.fromEntries(timing.scenes.map((s) => [s.id, s]));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Every word of a scene with the time the voice reaches it: its share of its sentence's letters. */
function wordTimes(scene) {
  const out = [];
  for (const s of scene.sentences) {
    const words = s.text.split(" ");
    const total = s.text.replace(/\s/g, "").length || 1;
    let before = 0;
    for (const w of words) {
      out.push({ word: w, at: s.start + (before / total) * s.duration });
      before += w.length;
    }
  }
  return out;
}

function cueTime(scene, cue, where) {
  if (/^\+\d+(\.\d+)?$/.test(cue)) return round(scene.start + parseFloat(cue));
  const [word, nth = "1"] = cue.split("#");
  const hits = wordTimes(scene).filter((w) => norm(w.word).startsWith(norm(word)));
  if (hits.length < +nth) die(`${where}: data-cue="${cue}", but scene ${scene.id} says "${word}" ${hits.length} time(s)`);
  // A bare word that occurs more than once lands on the first, which is easy to miss
  // ("picture" also matches "pictures"): say so, and how to pick another.
  if (!cue.includes("#") && hits.length > 1) {
    console.warn(`${where}: data-cue="${cue}" matches ${hits.length} words (${hits.map((h) => h.word).join(", ")}); landing on the first. Add #2, #3... to pick another.`);
  }
  return round(Math.max(scene.start + 0.1, hits[+nth - 1].at - CUE_LEAD));
}

/** A sentence cut into caption lines: at a comma once five words are in, and at LINE_WORDS (a line never ends on a function word). */
function lines(text) {
  const out = [];
  let cur = [];
  for (const w of text.split(" ")) {
    cur.push(w);
    if ((w.endsWith(",") && cur.length >= 5) || cur.length >= LINE_WORDS) {
      const carry = [];
      // A line of nothing but function words has no line to stay on, so it all carries, unless it is
      // already at the limit: then the limit wins and it is kept whole.
      if (cur.length < LINE_WORDS || !cur.every((x) => WEAK.has(norm(x)))) {
        while (cur.length && WEAK.has(norm(cur[cur.length - 1]))) carry.unshift(cur.pop());
      }
      if (cur.length) out.push(cur);
      cur = carry;
    }
  }
  if (cur.length) cur.length < 3 && out.length ? out[out.length - 1].push(...cur) : out.push(cur);
  return out.map((l) => l.join(" "));
}

function captions() {
  const caps = [];
  for (const scene of timing.scenes) {
    for (const s of scene.sentences) {
      const total = s.text.replace(/\s/g, "").length || 1;
      let before = 0;
      for (const line of lines(s.text)) {
        const len = line.replace(/\s/g, "").length;
        caps.push({ t: s.start + (before / total) * s.duration, e: s.start + ((before + len) / total) * s.duration + 0.3, text: line });
        before += len;
      }
    }
  }
  // One track: a line ends before the next one starts.
  caps.forEach((c, i) => {
    if (caps[i + 1]) c.e = Math.min(c.e, caps[i + 1].t - 0.05);
  });
  return caps
    .map((c, i) => `        <div id="cap-${String(i).padStart(3, "0")}" class="clip cap" data-start="${round(c.t)}" data-duration="${round(c.e - c.t)}" data-track-index="20"><span>${esc(c.text)}</span></div>`)
    .join("\n");
}

// scenes.html: its styles, its script, and its sections.
const src = readFileSync(join(dir, "scenes.html"), "utf8");
const styles = [...src.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const script = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
const seen = new Set();
const sections = [...src.matchAll(/<section([^>]*)>([\s\S]*?)<\/section>/g)].map((m) => {
  const id = (m[1].match(/data-scene="([^"]+)"/) || [])[1];
  if (!id) die(`scenes.html has a <section> with no data-scene: <section${m[1]}>`);
  const scene = byId[id];
  if (!scene) die(`scenes.html names scene ${id}, which has no script/${id}.txt (or run voice.mjs again)`);
  seen.add(id);
  const body = m[2].replace(/data-cue="([^"]+)"/g, (_, cue) => `data-cue="${cue}" data-at="${cueTime(scene, cue, `scene ${id}`)}"`);
  // 10 ms short of the next scene: scenes share a track, and touching ends read as an overlap.
  const attrs = m[1].replace(/\s*class="([^"]*)"/, "");
  const cls = ["clip", "scene", (m[1].match(/class="([^"]*)"/) || [])[1]].filter(Boolean).join(" ");
  return `      <section${attrs} id="scene-${id}" class="${cls}" data-start="${scene.start}" data-duration="${round(scene.duration - 0.01)}" data-track-index="1">\n        <div class="inner"><div class="cam">${body}</div></div>\n      </section>`;
});
const missing = timing.scenes.filter((s) => !seen.has(s.id)).map((s) => s.id);
if (missing.length) die(`scenes.html has no <section data-scene> for: ${missing.join(", ")}`);

const music = musicBed(dir, cfg.music, timing);
const html = readFileSync(join(REPO, "kit", "shell.html"), "utf8")
  .replace("{{music}}", music ? `<audio id="music" src="assets/music.wav" data-start="0" data-duration="${timing.total}" data-track-index="31" data-volume="1"></audio>` : "")
  .replaceAll("{{title}}", esc(cfg.title))
  .replaceAll("{{total}}", String(timing.total))
  .replace("{{theme}}", () => themeCss(cfg.theme, dir))
  .replace("{{base}}", () => readFileSync(join(REPO, "kit", "base.css"), "utf8"))
  .replace("{{flair}}", () => flairCss(cfg.flair))
  .replaceAll("{{seed}}", String(cfg.seed ?? seedFor(basename(dir))))
  .replace("{{styles}}", () => styles)
  .replace("{{scenes}}", () => sections.join("\n"))
  .replace("{{captions}}", () => captions())
  .replace("{{kit}}", () => readFileSync(join(REPO, "kit", "kit.js"), "utf8").trimEnd())
  .replace("{{script}}", () => script);
writeFileSync(join(dir, "index.html"), html);
writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: basename(dir), name: cfg.title }, null, 2) + "\n");

// GSAP from this repo's own install, so a render needs no network.
const gsap = join(REPO, "node_modules", "gsap", "dist", "gsap.min.js");
if (!existsSync(gsap)) die("GSAP is not installed here: npm install");
mkdirSync(join(dir, "assets", "vendor"), { recursive: true });
copyFileSync(gsap, join(dir, "assets", "vendor", "gsap.min.js"));

console.log(`index.html: ${timing.scenes.length} scenes, ${timing.total} s, theme ${cfg.theme}${music ? ", music" : ""}`);
