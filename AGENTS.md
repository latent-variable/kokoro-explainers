# AGENTS.md

Start here. This file says what the project is, where everything lives, which skill to load,
and what is expected of you. `README.md` is the same story for humans.

## What this is

ShipShow: turn a shit show into a ship show. When agents change a code base faster than a person can follow, a short narrated video of what changed and what needs deciding lets them ship code they understand.

A pipeline that turns plain text into narrated explainer videos on one machine (a Kokoro
voice, HyperFrames scenes), and a set of skills for agents to make them well. The everyday
use is a decision video: an agent working on a feature hands off to a fresh explainer agent,
which explains what the person needs to make a call. Feature and release explainers use the
same skills.

The skills in `skills/` are the team's baseline. Each person tailors on top of them in
`local/`, which is never committed (`tailor` skill).

## Where things are

| Path | What |
|---|---|
| `.claude-plugin/`, `agents/` | The Claude Code plugin: `plugin.json`, `marketplace.json`, and the `critic` agent (Read, Grep, Glob, Bash and Skill; Write, Edit and NotebookEdit denied, `maxTurns` 40, Sonnet by default; Bash can still write, so it is told to use a temporary directory). Validate with `claude plugin validate .` (one expected warning: no `version`) |
| `docs/PRD.md`, `docs/DESIGN.md` | The requirements, and the design decisions and behaviour. Kept current (*Docs that stay current*) |
| `skills/` | Every skill. `npm install` links them into `.claude/skills/` for Claude Code; other agents read them here |
| `videos/<name>/` | One video: `script/`, `scenes.html`, `video.json`, `sources.md`, `critics.md`, `REVIEW.md` |
| `bin/` | The pipeline: `voice`, `build`, `render`, `make`, `review`, `new`, `doctor`, `critics`; and `usage` (token and context tracking) |
| `kit/` | The page, base styles and timeline every video shares |
| `themes/` | Shared themes (`shipshow`, `paper`, `launch`, `buildday`); a client's goes in `local/themes/` |
| `template/` | What `npm run new` copies |
| `.claude/settings.json`, `.claude/hooks/` | The project's Claude Code hooks and read denials (tracked; `.claude/skills/` is the generated skill links and is not) |
| `local/` | Gitignored, per person: `preferences.md`, `critics.md`, `skills/`, and `videos/` about code that is not this repo's |

## Skills

| Skill | Load it to |
|---|---|
| `repo-context` | Get oriented before changing this repo: shape, commands, traps, how to validate |
| `change-context` | Understand a change (diff, PR, release): why, before and after, breaking, risk |
| `evidence-standard` | The shared rules for evidence: tags, pins, safe running, absence, where results go |
| `code-context` | Understand any code base: purpose, functional and non-functional requirements, API behaviour, evidenced and with unknowns listed |
| `explain-concept` | Plan a video: viewer, outcome, one idea per scene, the picture for each |
| `decision-brief` | Hand a decision to a fresh explainer: options, costs, pick, exact commit |
| `narration-writing` | Write a script for the ear: pace, numbers, pronunciation |
| `glossary` | One name per concept, across script, captions and scenes |
| `explain-handoff` | Return a finished video with its status, next step and open questions |
| `explainer-video` | Make or update a video. You are the builder |
| `critic-loop` | Judge a video with fresh critics, fix, repeat until they pass; add a new critic |
| `tailor` | Record how one person wants their explainers, in `local/` |
| `theme` | Make a theme, usually from a client's brand |
| `critic-accuracy`, `critic-clarity`, `critic-pacing`, `critic-sync`, `critic-visuals`, `critic-consistency`, `critic-engagement`, `critic-decision`, `critic-grounding` | Be one critic, when the loop assigns you |

## What is expected

- **The agent that builds a video never judges it.** Every critic is a fresh agent that has
  never seen the build: never a fork, never yourself. Its whole job is to find what is wrong.
- **A video is done when its critics pass or its review plan's cap is reached**, never when it
  merely renders: `REVIEW.md` records each round, and at the cap every open finding as
  accepted or declined with its reason. The floor (accuracy, and decision for a decision
  video) can never ship open. Which critics a video gets is in its `video.json`; its own bar is in `critics.md`.
- **Every claim traces to `sources.md`.** A fact the sources lack is a gap to report, never
  one to fill in.
- **A bar you keep wishing a video met becomes a critic** (`critic-loop`, *A new critic*).
- **A video about another code base goes in `local/videos/`.** This repo is public.
- **Skills set the bar, not the method** (team, 2026-10-17). They say what a good video is and
  how it is judged. How an agent manages its context or plans its steps is its own business,
  and a rule about it is friction the next model has to work around. The bars are not method:
  who builds, who judges (a fresh agent), and where facts come from (the code, `sources.md`)
  hold for every agent.

## Docs that stay current

Two files record what the project must do and why it is built the way it is. They are part of
the work, not paperwork after it:

| File | Holds | Update it when |
|---|---|---|
| `docs/PRD.md` | Problem, users, goals, functional and non-functional requirements with status, scope, open questions | A requirement is added, changed, dropped or finished; the status of an F or N line moves; an open question is answered or raised |
| `docs/DESIGN.md` | How it fits together, the decision log, observable behaviour, how the design was tested | You make a design decision, change how something behaves, reverse an earlier choice, or learn a trap |

**Update them in the same change as the code, skill or doc that moved them**, before you commit.
A change to `bin/`, `kit/`, `template/`, `themes/`, a skill, the critics, `agents/`, `test/`, `sample_application/`,
the plugin layout, CI, `package.json`, the lockfile, `requirements.txt`, the README, `AGENTS.md` or `CLAUDE.md`
that leaves both files without a substantive change (at least 40 characters of added text; whitespace, a
punctuation edit or the review date do not count) needs `docs: no change - <reason>` (a reason of ten characters
or more) in the PR title or the last non-merge commit message. The text added may be unrelated to the change:
the rule makes a stale number loud, not a stale claim, so read the docs you touch.

- When you add or rename a skill, list it in the skills table above and in the PRD.
- How to write an entry, and what `npm test` and CI check: `docs/DESIGN.md`, *Keeping these files current*.
- **Bump nothing by hand in `plugin.json`:** it has no `version`, so the commit SHA versions the plugin.

## Set up

Node.js 22+, Python 3.10 to 3.13 (`npm run setup` picks one; `doctor` checks it) and ffmpeg; tested on macOS.

```
npm install                                                       # HyperFrames, GSAP; links skills into .claude/skills
npm run setup                                                     # .venv with Kokoro, which hyperframes tts runs
npm run doctor                                                    # what is missing, with the fix; voices one word
npm run setup:omnivoice                                           # optional, Apple Silicon: OmniVoice for better and cloned voices
```

The first `doctor` downloads Kokoro into `~/.cache/hyperframes/tts` (about 340 MB). The first
render downloads a headless Chrome if HyperFrames finds none (about 190 MB). The first OmniVoice
take downloads its model (about 1.5 GB, `~/.cache/huggingface`); `npm run doctor -- --omnivoice`
checks it and voices one word.

## Commands

| Command | What it does |
|---|---|
| `npm run new -- <folder>` | A new video from `template/` (`videos/x` for this repo, `local/videos/x` for any other code base) |
| `npm run voice -- <folder>` | One take per sentence (Kokoro, or OmniVoice: `--engine omnivoice --voice <name>` to try it), then `assets/narration.wav` and `timing.json` |
| `npm run build -- <folder>` | The HyperFrames composition, `index.html`, from `scenes.html` and the timing |
| `npm run check -- <folder>` | HyperFrames' own check: lint, layout, motion, caption contrast |
| `npm run preview -- <folder>` | The HyperFrames studio, to scrub through it |
| `npm run render -- <folder>` | `out/<name>.mp4`, the name taken from the folder's path (`--draft` for a fast pass) |
| `npm run make -- <folder>` | Voice, build, lint and render (`--speed 1.5` to try a pace without editing `video.json`) |
| `npm run review -- <folder>` | The critics' evidence: `review/packet.md` and `review/frames/` (`--frames scenes` for fewer stills) |
| `npm run critics -- <folder>` | The video's critic plan: critics, models, rounds, severity, and a rough time and token estimate (`--preset`, `--rounds`, `--until`, `--model`, `--final`, `--frames`, `--rerun`, `--critics`, `--json`) |
| `npm run skills` | Link new skills in `skills/` or `local/skills/` into `.claude/skills/` |
| `npm run usage` | Tokens and context per agent for the newest Claude Code session of this repo, subagents included (`-- <session id>` for another, `-- --json` for data, `-- --since <ISO time>` for one task's share); read from `~/.claude/projects/`, or from `CLAUDE_PROJECTS_DIR` |
| `npm run results -- <folder> [start]` | A video's `results/` folder from what exists: `start` marks the beginning of the run; the next call writes `run.json`, `usage-delta.json` (tokens since the start, subagents included), `critic-rounds.json` (findings by critic and severity from `review/round-N/`), `run.md`, and copies the hashed captures. A file you wrote yourself is never overwritten: the new one lands beside it as `*.generated.*` |
| `claude plugin validate .` | The two manifests only (`plugin.json`, `marketplace.json`); `claude plugin validate skills` and `agents` look at components but only warn on a broken one, so a test parses every `SKILL.md` and `agents/critic.md` front matter. One warning is expected (no `version`, on purpose: the commit SHA versions the plugin); `--strict` fails on it |
| `npm test` | No Kokoro needed; CI runs only this |

A change to `bin/`, `kit/` or `template/` is validated by running `make` and `review` on
`videos/how-it-works` and looking at the contact sheets.

## A video's files

| File | What it is |
|---|---|
| `script/01-intro.txt`, `02-...` | One file per scene, read aloud in file-name order. A sentence ends at `.`, `!` or `?` and a space |
| `scenes.html` | One `<section data-scene="01-intro">` per script file, a `<style>` for the look, optionally a `<script>` |
| `video.json` | `title`, `kind` (`decision`, `feature`, `release`), `importance` and `importance_reason` (set by the builder), `shows_code` (puts `critic-grounding` on the floor; read from `scenes.html` when absent: a `<pre>`, `<code>` or `.ss-code` sets it, and `false` cannot lower it), `voice`, `speed`, `theme`, `flair`, `review`, `say`, `audience`; optional `lead`, `gap`, `tail` (seconds of pause), `seed` |
| `sources.md` | Every claim the video makes, with its source |
| `critics.md` | This video's own bar, applied by every critic |
| `brief.md` | A decision video's handoff from the agent that asked for it |
| `REVIEW.md` | The critic rounds |

**Cues.** An element with `data-cue` arrives when the voice reaches that word:
`data-cue="Kokoro"` (the first word starting "Kokoro" in that scene), `data-cue="model#2"`
(the second), `data-cue="+0.3"` (0.3 s into the scene). The build stops on a word the scene
never says, and warns when a bare word occurs more than once. `data-anim` picks the entrance
(the theme's `--entrance` when absent): `up`, `fade`, `pop`, `left`, `right`, `grow`, `zoom`,
`blur`, and `type` (letter by letter), `draw` (an SVG's strokes draw themselves), `count` (the
number in the text counts up), `highlight` (a marker sweeps under text already shown),
`stagger` (children in turn), `pulse` (pops, then beats), `scramble` (decodes from glyphs),
`glitch` (arrives split into colour channels, jitters, settles), `slam` (lands big and hard). A `<script>` in `scenes.html` runs after the shared
timeline and may add GSAP tweens to `tl`; each cued element's time is its `data-at`.

**Voice.** Two engines, set by `engine` in `video.json` or `local/config.json` (`--engine` on `make` or
`voice` tries one). **`kokoro`** is the default and runs anywhere: `af_heart`; `npx hyperframes tts --list`
shows the rest; non-English voices need `espeak-ng` system-wide. **`omnivoice`** is higher quality and
clones voices, on Apple Silicon only (MLX; `npm run setup:omnivoice`, then `"engine": "omnivoice"`). Its
`voice` is a recording: a **built-in** one (`caro_davy`, the default, `bill_boerst`, `peter_yearsley`,
`stuart_bell`, `marius`, `javert`: CC0 clips from kyutai/tts-voices, `bin/omnivoice-voices.json`; and `eve`,
VCTK speaker p361, CC BY 4.0, which a public video credits: "Voice: VCTK corpus, CC BY 4.0") or a
**clone**, a 3 to 10 second clip at `local/voices/<name>.wav` with, optionally, the words spoken in it at
`<name>.txt` beside it (a clip that ends mid-word, or has no transcript, clones worse: Eve's silent takes, 2026-10-17). `say` maps a written word to what the engine is told to say
(`"HyperFrames": "Hyper Frames"`); captions keep the written form.

**Look.** A theme is `themes/<name>/theme.css` (or `local/themes/<name>/`, which wins): a
`:root` of tokens for colour, type, spacing, shape, captions and motion; `themes/shipshow`
lists them all. Fonts and images sit beside it and are copied to `assets/theme/`, relative
`url()`s rewritten (`bin/lib.mjs`, `themeCss`). Most specific wins: `--theme`, then
`video.json`, then `local/config.json`, then `shipshow`. `kit/base.css` draws the canvas,
captions and the `ss-` pieces from the tokens; a scene's own styles should use the tokens
too, or a theme cannot restyle it.

**Motion.** Theme tokens `--transition` (`none`, `fade`, `rise`, `slide`, `zoom`, `wipe`,
`flash`), `--camera` (`none`, `push`: a slow push-in per scene), `--ambient` (`none`, `glow`,
`grid`, `dots`, `stars`, `horizon` (a lit planet rim low in the frame), or several: `stars glow`), `--ambient-strength`, `--progress` (`on`, `off`) and `--entrance`. `video.json`
`"flair"` overrides them for one video; a section's `data-transition` or `data-camera` for
one scene. Ambient motion is seeded from the video's name (`"seed"` to change it), so a
render is repeatable and each video moves its own way.

**Review.** How much critic review a video gets is a plan with dials (`critics`, `rounds`,
`until`, `model`, `final`, `frames`, `rerun`) and presets (`quick`, `standard`, `thorough`),
resolved by `reviewPlan` in `bin/lib.mjs`. The builder picks the preset by setting
`video.json` `"importance"` (`low`, `normal`, `high` for `quick`, `standard`, `thorough`) with
an `"importance_reason"`. Most specific wins: flags, then `video.json` `"review"` (an
explicit preset there beats importance), then importance, then `local/config.json`
`"review"`, then the kind's default (`quick` for a decision video, else `standard`). `skills/critic-loop` has what each dial trades and the floor no dial lowers.
The estimate's constants are measurements from 2026-10-17; replace them when you measure.

**Music.** `video.json` `"music": {"file", "volume", "duck"}` puts a bed under the narration:
the build decodes it with ffmpeg, loops it to length, lowers it while the voice speaks (from the
sentence timings, with short ramps), fades it in and out, and writes `assets/music.wav`
(`bin/lib.mjs`, `musicBed`). A missing file warns and builds without music, since music is
often local (`local/music/`): a generated track's licence is its maker's, so it is never
committed. Check a generated track for vocals before using it under narration (Whisper hearing
words is the sign); MiniMax Music 3 sang on its first take for why-shipshow despite
`--instrumental`.

**Speed.** A multiplier on ShipShow's base pace (Kokoro at 0.85, OmniVoice at its own 1.0: both about 160 words
a minute), not either engine's own: 1.25 by default. OmniVoice takes 1.0 to 1.3, the range it was tested at. The packet
measures pace in syllables a minute (base about 210, `BASE_SPM`), since words a minute runs high on short words.
Pauses shrink with it. The most specific wins: `--speed` on
`make` or `voice`, then `video.json`, then the person's `local/config.json`, then 1.25
(`bin/lib.mjs`, `config`). A take is re-voiced when its speed changes.

## How the timing works

Kokoro does not report word times, and a speech-recognition model to find them would be a
second, larger download. So `bin/voice.mjs` voices each sentence on its own and places it on
the track: a sentence's start is exact because we put it there. A word inside a sentence is
placed by its share of the sentence's letters, close enough for a card to land on the word
that names it. `bin/build.mjs` turns those times into `data-start` and `data-duration` on each
scene and caption and `data-at` on each cued element; `kit/kit.js` is the shared GSAP timeline;
HyperFrames renders the page frame by frame in headless Chrome and muxes in the narration.

## Layout

```
bin/        voice, build, render, make, review, critics, new, doctor, setup, link-skills, usage; lib.mjs is shared, measure.mjs holds the packet's measurements, python.mjs the supported Python range
kit/        shell.html (the page), base.css (canvas, captions, ss- pieces), kit.js (timeline, effects)
themes/     shipshow, paper, launch and buildday; each a theme.css of tokens, plus fonts (Space Grotesk, Space Mono, JetBrains Mono: SIL OFL)
skills/     the explainer and development skills, critic-loop, tailor, theme and the nine critics
template/   what npm run new copies
videos/     videos about this repo: how-it-works (the example) and why-shipshow (the pitch)
skills/critic-grounding/scripts/  excerpt.mjs and check-excerpt.mjs, the excerpt check (run through the skill)
skills/evidence-standard/scripts/  sandbox-run.sh, capture.mjs, verify-vendored.sh (run through the skill)
sample_application/  pacer-demo, a toy ad-spend pacer built by three agents in a day: the Aperiam demo (README, history/, agents/; ANSWER.md is a spoiler)
docs/        PRD.md and DESIGN.md (kept current); assets/ holds the README's images: make-assets.mjs draws the SVGs (fonts embedded); demo.gif and themes.jpg are frames of videos/invoice-leak
test/       sentence splitting, pronunciation swaps, cue and caption timing, skill links, usage counting, the excerpt checker, the sandbox runner, the docs rule
local/      gitignored, per person (tailor skill)
```

## Traps

- **Kokoro's Python is this repo's `.venv`**, passed to `hyperframes tts` as `HYPERFRAMES_PYTHON` (`bin/lib.mjs` `ttsEnv`). A user-set `HYPERFRAMES_PYTHON` wins.
- **`requirements.txt` pins phonemizer.** kokoro-onnx 0.6.1 needs `EspeakWrapper.set_data_path`, which phonemizer 3.3 lacks. Bump the two together and run `npm run doctor`.
- **espeak-ng fails when its data path is 160 characters or longer** (measured 2026-10-17: 159 works, 160 fails). It reports a missing `.../site-packages//phontab`, not a path error. A venv deep in a temp or worktree path hits this; `doctor` checks the length.
- **OmniVoice is Apple Silicon only, and opt-in.** `requirements-omnivoice.txt` is separate so Kokoro installs anywhere; `doctor` lists the engine as `opt` until you ask with `--omnivoice`. `bin/omnivoice.py` voices every stale sentence in one process (the model loads once) from a job file `bin/voice.mjs` writes; a user-set `HYPERFRAMES_PYTHON` is its Python too, which is how the tests stand a fake worker in for it. The model and the built-in clips are pinned by revision in `bin/omnivoice-voices.json`.
- **A clone is somebody's voice.** OmniVoice's own disclaimer prohibits unauthorized cloning and impersonation: clone yourself or someone who agreed. `local/` never leaves the machine, so a clone never reaches this public repo; keep it that way.
- **OmniVoice drops words when its window is too short, so speed is never applied by shortening it.** It fills the duration it is given: squeezed to 1.3x, 7 of 24 sentences lost or garbled words ("not a" vanished from "not a wall of logs"); generated at its natural length and then time-stretched (ffmpeg `atempo`), none did (measured 2026-10-17 with Whisper, why-shipshow). `bin/omnivoice.py` also trims the padding's silence from each take (13.8 s of a 67 s video was dead air) and re-voices a take that comes out silent. At 16 steps instead of 32 it dropped words on long lines, so `STEPS` stays 32. Nothing in the pipeline hears a take back: listen before you ship.
- **A take's identity includes the voice's bytes.** A clip replaced under the same name (or its `.txt` edited) is a different voice, so its takes are voiced again; a Kokoro take's key is unchanged from before OmniVoice, so existing takes stay valid.
- **No speech recognition, on purpose.** `hyperframes transcribe` built whisper.cpp and then timed out downloading its model after six minutes. Timing comes from voicing each sentence separately (`bin/voice.mjs`), so a word inside a sentence is placed by its share of the letters. Do not add an ASR step to fix a cue a few hundred milliseconds off; split the sentence or use `data-cue="+seconds"`.
- **Takes are cached by text, voice and speed** in `assets/voice/<scene>-<n>.key`. Inserting a sentence shifts the number of every later sentence in that scene (numbering restarts per scene), so those re-voice; the cost per take has not been measured.
- **Generated files are gitignored** (`videos/*/assets/`, `review/`, `index.html`, `meta.json`, `timing.json`). Never commit audio, frames or renders.
- **The name is ShipShow**, one word, two capitals; the repo is `latent-variable/shipshow` (renamed from kokoro-explainers 2026-10-17, and GitHub redirects the old address). A rename also changes the PR reviewer's allowlist (latent-git-agents `config/repos.json` and `tests/repo-allowlist.test.mjs`), or PRs stop being reviewed.
- **`hyperframes lint` warns `nested_structure_needs_subcomposition` and `timeline_track_too_dense`** on every video. Advisory: each scene is one section on one track by design. Errors still block.
- **Project hooks enforce the no-delete rule** (`.claude/settings.json`, `.claude/hooks/`, DESIGN D39): the Bash guard refuses `rm`, `find -delete` and the git commands that discard work, the file guard refuses `sample_application/src/` and recorded runs, and the Stop hook runs `npm test`. A person overrides on purpose with `SHIPSHOW_ALLOW_DESTRUCTIVE=1` or `SHIPSHOW_EDIT_SAMPLE=1`. Move things aside with `mv` instead.
- The scripts never delete files: a stale take is overwritten, never removed.
- **Never write a literal style or script tag in a comment** inside `kit/` or `themes/`: the
  build inlines them into the page, and `hyperframes lint` reads it as an unclosed tag (twice,
  2026-10-17).
- **A theme cannot restyle a hard-coded colour or font.** A scene that writes `#182033`
  instead of `var(--card)` keeps it in every theme.

## For the PR reviewer

- **Don't flag code-level reference in this file as belonging elsewhere.** The owner put
  all of it here on purpose (2026-10-17): the README stays short for people, and this file
  is where agents find the code. Raised and declined on #6 and #8.

## Agent context (scope + memory)
<!-- BEGIN agent-context (managed by ~/.agents/bin/project-sync.sh) -->
- You are in **PROJECT scope** (this repo). Everything that is true across projects lives in user-scope canon (`~/.agents/AGENTS.md` + skills) and is NOT repeated here; this file holds only what is true of THIS repo.
- Project memory + shared skills: `.agents/` (gitignored). Read `.agents/memory/MEMORY.md` first.
- `.claude`/`.agents` here may be symlinks; verify with `readlink` before claiming a write landed.
- This file holds project facts only. Check with `~/.agents/bin/canon-echo.sh .`; a real exception is marked `<!-- canon-override: <rule> — <why> (date) -->`.
- Refresh infra: `~/.agents/bin/project-sync.sh .`
<!-- END agent-context -->
