# kokoro-explainers

Narrated explainer videos made from plain text, on your own machine. You write a script and one HTML page; [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) reads the script and [HyperFrames](https://hyperframes.heygen.com) draws the scenes and records them to an MP4, with captions.

Nothing is sent to a cloud service. The voice model is about 340 MB and runs on the CPU.

Built for the amperium.ai hackathon.

## Set it up

With Node.js 22+, Python 3.10+ and ffmpeg (tested on macOS; Linux should work but has not been tried):

```
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm run doctor
```

`npm run doctor` checks each piece, prints the fix for anything missing, and ends by voicing one word with Kokoro. The first run downloads the model into `~/.cache/hyperframes/tts`.

## Make the example

```
npm run make -- videos/how-it-works
```

That writes `out/how-it-works.mp4`: a one-minute video that explains this repo. On an M-series Mac the voice takes about 10 seconds and the render about 20.

## Make your own

```
npm run new -- videos/my-video
```

Then edit three things in `videos/my-video/`:

| File | What it is |
|---|---|
| `script/01-intro.txt`, `02-...` | One file per scene, read aloud in file-name order. Short spoken sentences. |
| `scenes.html` | One `<section data-scene="01-intro">` per script file, plus a `<style>` for the look. |
| `video.json` | The voice, its speed, and pronunciation fixes. |

Run `npm run make -- videos/my-video` again after any change. Only sentences whose text changed are voiced again.

### Making things appear on a word

Inside a scene, give an element `data-cue` and it arrives when the voice reaches that word:

```
<section data-scene="02-voice">
  <div class="card" data-cue="Kokoro">Kokoro</div>          <!-- on the first word starting "Kokoro" -->
  <div class="card" data-cue="model#2" data-anim="pop">…</div>  <!-- on the second "model", popping in -->
  <h2 data-cue="+0.3">The voice</h2>                         <!-- 0.3 s into the scene -->
</section>
```

`data-anim` is one of `up` (the default), `fade`, `pop`, `left`, `right`, `grow`. The build stops if a cue names a word its scene never says, so a typo cannot silently mistime a scene.

For anything more, add a `<script>` to `scenes.html`. It runs after the shared timeline is set up and can add GSAP tweens to `tl`; each cued element's time is in its `data-at` attribute.

### video.json

```
{
  "title": "How kokoro-explainers works",
  "voice": "af_heart",
  "speed": 1.0,
  "say": { "HyperFrames": "Hyper Frames", "MP4": "M P 4" }
}
```

- `voice`: `af_heart`, `af_nova`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bf_isabella`, `bm_george`, and more (`npx hyperframes tts --list`). Non-English voices also need `espeak-ng` installed system-wide.
- `say`: what Kokoro is told to say for a word it gets wrong. Captions still show the word as written.
- `lead`, `gap`, `tail` (seconds, optional): the pause before a scene's first sentence, between sentences, and after its last.

## The steps, one at a time

| Command | What it does |
|---|---|
| `npm run voice -- videos/x` | Voices each sentence with Kokoro and writes `assets/narration.wav` and `timing.json` |
| `npm run build -- videos/x` | Writes the HyperFrames composition, `index.html`, from `scenes.html` and the timing |
| `npm run check -- videos/x` | HyperFrames' own check: lint, layout, motion and caption contrast |
| `npm run preview -- videos/x` | Opens the composition in the HyperFrames studio to scrub through it |
| `npm run render -- videos/x` | Records it to `out/x.mp4` (`--draft` for a fast, lower-quality pass) |
| `npm run make -- videos/x` | Voice, build, lint and render in one go |

## How it works

Kokoro does not report when each word is spoken, and speech recognition to find out would add a second, larger model. So every sentence is voiced on its own and placed on the track by `bin/voice.mjs`. Where a sentence starts is known exactly because we put it there. A word's time inside its sentence is estimated from its share of the sentence's letters, which is close enough for a card to land on the word that names it.

`bin/build.mjs` then turns those times into `data-start` and `data-duration` on each scene and caption, and `data-at` on each cued element. `kit/kit.js` is the shared GSAP timeline that shows each scene in its own window and animates each element in at its time. HyperFrames renders the page frame by frame in headless Chrome and muxes in the narration.

## Layout

```
bin/voice.mjs      script -> one Kokoro take per sentence -> narration.wav + timing.json
bin/build.mjs      scenes.html + timing.json -> index.html (the HyperFrames composition)
bin/render.mjs     index.html -> out/<name>.mp4
bin/make.mjs       all of the above, plus lint
bin/new.mjs        a new video folder from template/
bin/doctor.mjs     what this machine is missing
kit/shell.html     the page every video shares: canvas, captions, audio
kit/kit.js         the timeline every video shares
template/          the starting point for a new video
videos/            one folder per video
test/              npm test: sentence splitting, pronunciation swaps, cue and caption timing
```

Generated files (voice takes, `narration.wav`, `timing.json`, `index.html`, renders) are not committed.

## Licenses

This repo is MIT. Kokoro-82M's weights are Apache 2.0, HyperFrames is Apache 2.0, and GSAP is under its free [standard license](https://gsap.com/standard-license).
