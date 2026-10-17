# ShipShow

**Turn a shit show into a ship show.**

Agents change a code base faster than anyone can read it, and keeping up turns into a shit show. ShipShow makes short narrated videos that explain what changed, how it works, and what you need to decide, so you ship code you understand.

You write a script and one HTML page, or your agent does; [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) reads the script and [HyperFrames](https://hyperframes.heygen.com) draws the scenes and records them to an MP4, with captions.

Nothing is sent to a cloud service. The voice model is about 340 MB and runs on the CPU; the first render also downloads a headless Chrome (about 190 MB) if HyperFrames finds none.

Built for the amperium.ai hackathon. The everyday use is a decision video: an agent working on a feature hands off to a fresh explainer agent, which makes a short video of what you need to know to make a call, and recommends one. The same skills make feature explainers (how something in a code base works) and release explainers.

<!-- The rendered how-it-works video goes here once it has cleared its critics. -->

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

Then edit these in `videos/my-video/`:

| File | What it is |
|---|---|
| `script/01-intro.txt`, `02-...` | One file per scene, read aloud in file-name order. Short spoken sentences. |
| `scenes.html` | One `<section data-scene="01-intro">` per script file, plus a `<style>` for the look. |
| `video.json` | The voice, its speed, pronunciation fixes, who it is for, and its critics. |
| `sources.md` | The facts the video may state, each with its source. |

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
  "title": "How ShipShow works",
  "voice": "af_heart",
  "speed": 1.0,
  "say": { "HyperFrames": "Hyper Frames", "MP4": "M P 4" }
}
```

- `voice`: `af_heart`, `af_nova`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bf_isabella`, `bm_george`, and more (`npx hyperframes tts --list`). Non-English voices also need `espeak-ng` installed system-wide.
- `say`: what Kokoro is told to say for a word it gets wrong. Captions still show the word as written.
- `lead`, `gap`, `tail` (seconds, optional): the pause before a scene's first sentence, between sentences, and after its last.

## Skills and critics

Agents make these videos through skills in `skills/` (`npm install` links them into `.claude/skills/` for Claude Code; `AGENTS.md` points every other agent at them).

- **`explainer-video`** builds a video: facts into `sources.md` first, then the script, the scenes, the voice and the render.
- **`critic-loop`** judges it. Each critic is a fresh agent that never saw the build, because the agent that made something is the worst judge of it. Critics return findings with a severity; the builder fixes them and runs fresh critics until none is blocking or major. `REVIEW.md` records the rounds.

| Critic | Judges |
|---|---|
| `critic-accuracy` | Every claim, spoken or shown, against the video's `sources.md` |
| `critic-clarity` | Whether the intended viewer follows it and knows what to do |
| `critic-pacing` | Speaking rate, pauses, scene length, time to read on-screen text |
| `critic-sync` | Whether what is shown matches what is being said, when it is said |
| `critic-visuals` | Legibility, contrast, layout, every frame finished |
| `critic-consistency` | Same names, terms and look from start to end |
| `critic-engagement` | Whether the intended viewer would keep watching, and the design is made for them |
| `critic-decision` | For a decision video: whether a person who watches once can make the call |

A decision video adds `critic-decision`: the call is stated, every option has its gain and its cost, one is recommended with the reason, and doing nothing is accounted for.

A video picks its critics in `video.json` (`"critics"`) and can add its own bar in `critics.md`, such as "every breaking change shows before and after code". When the same bar keeps coming back, it becomes a new critic skill.

`npm run review -- videos/x` writes the evidence the critics judge: the script with timings, words a minute per scene, every pause, every cue with what is being said when it lands, reading time for on-screen text, and a still after each cue and at each scene end.

## Make it yours

The skills are the team's baseline. Your own taste goes in `local/`, which git ignores, so it never reaches the repo:

| Path | What |
|---|---|
| `local/preferences.md` | How you like explainers: depth, order, tone, voice, speed, look |
| `local/critics.md` | Your bar: every critic applies it to every video you make |
| `local/skills/` | Your own skills and critics (`npm run skills` links them for Claude Code) |
| `local/videos/` | Videos about any code base other than this one: this repo is public |

You don't edit these by hand. Tell your agent how you want your explainers ("open with the decision", "always show the code") and the `tailor` skill records it, with the reason. When a preference would help everyone, it becomes a pull request to the baseline instead.

## The steps, one at a time

| Command | What it does |
|---|---|
| `npm run voice -- videos/x` | Voices each sentence with Kokoro and writes `assets/narration.wav` and `timing.json` |
| `npm run build -- videos/x` | Writes the HyperFrames composition, `index.html`, from `scenes.html` and the timing |
| `npm run check -- videos/x` | HyperFrames' own check: lint, layout, motion and caption contrast |
| `npm run preview -- videos/x` | Opens the composition in the HyperFrames studio to scrub through it |
| `npm run render -- videos/x` | Records it to `out/x.mp4` (`--draft` for a fast, lower-quality pass) |
| `npm run make -- videos/x` | Voice, build, lint and render in one go |
| `npm run review -- videos/x` | The critics' evidence: `review/packet.md` and `review/frames/` |

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
bin/review.mjs     the evidence critics judge: packet.md and frames
bin/doctor.mjs     what this machine is missing
skills/            explainer-video, critic-loop, tailor and the eight critics
kit/shell.html     the page every video shares: canvas, captions, audio
kit/kit.js         the timeline every video shares
template/          the starting point for a new video
videos/            one folder per video
test/              npm test: sentence splitting, pronunciation swaps, cue and caption timing
```

Generated files (voice takes, `narration.wav`, `timing.json`, `index.html`, renders) are not committed.

## How we work

- **Use it on your own work.** Each of us makes explainers for something we actually need explained: a repo, a pull request, a feature, a release (HyperFrames itself is a good first subject). Real use is what finds the gaps.
- **Friction becomes a pull request.** Anything that slowed you down or that you did not like, tell your agent to fix it here and open a PR. A bar you keep wishing a video met becomes a critic.
- **Every change goes through a pull request.** `main` takes no direct pushes: a PR needs CI green, and every PR gets an automated review whose blocking findings are fixed (or declined with a reason) before it merges.

## Licenses

This repo is MIT. Kokoro-82M's weights are Apache 2.0, HyperFrames is Apache 2.0, and GSAP is under its free [standard license](https://gsap.com/standard-license).
