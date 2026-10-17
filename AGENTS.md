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
| `.claude-plugin/`, `agents/` | The Claude Code plugin: `plugin.json`, `marketplace.json`, and the `critic` agent (read-only tools plus Skill, told not to write). Validate with `claude plugin validate .` (one expected warning: no `version`) |
| `docs/PRD.md`, `docs/DESIGN.md` | The requirements, and the design decisions and behaviour. Kept current (*Docs that stay current*) |
| `skills/` | Every skill. `npm install` links them into `.claude/skills/` for Claude Code; other agents read them here |
| `videos/<name>/` | One video: `script/`, `scenes.html`, `video.json`, `sources.md`, `critics.md`, `REVIEW.md` |
| `bin/` | The pipeline: `voice`, `build`, `render`, `make`, `review`, `new`, `doctor`; and `usage` (token and context tracking) |
| `kit/` | The page and timeline every video shares |
| `template/` | What `npm run new` copies |
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
| `critic-accuracy`, `critic-clarity`, `critic-pacing`, `critic-sync`, `critic-visuals`, `critic-consistency`, `critic-engagement`, `critic-decision`, `critic-grounding` | Be one critic, when the loop assigns you |

## What is expected

- **The agent that builds a video never judges it.** Every critic is a fresh agent that has
  never seen the build: never a fork, never yourself. Its whole job is to find what is wrong.
- **A video is done when its critics pass**, not when it renders: `REVIEW.md` records each
  round. Which critics a video gets is in its `video.json`; its own bar is in `critics.md`.
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
A change that touches `bin/`, `kit/`, `template/`, a skill, the critics or the plugin layout
and leaves both files untouched needs a reason in the commit message ("no requirement or
decision changed").

- A new decision is a new entry at the end of the log: number, date, decision, why, what it
  costs. Never rewrite a past entry; supersede it with a new one that names it.
- A requirement keeps its ID. Move its status (done, in progress, planned, open) rather than
  deleting it.
- Behaviour lines name the file they come from, so they can be checked. Verify a line before
  you write it: read the code or run it.
- Ground a decision in evidence: a file, a measurement, a finding in `skills/REVIEW.md`, or a
  source you read. What you do not know goes in the PRD's open questions, not in a guess.
- When you add or rename a skill, list it in the skills table above and in the PRD.
- `npm test` fails if either file is missing or empty, if this section's heading is gone, if a skill
  is missing from the skills table or the PRD, if a critic is missing from `docs/assets/critics.svg`,
  or, in CI on a pull request, if `bin/`, `kit/`, `template/`, `skills/`, `agents/` or
  `.claude-plugin/` changed and neither doc did (a commit message line `docs: no change` overrides it).
- **Bump nothing by hand in `plugin.json`:** it has no `version`, so the commit SHA versions the plugin.

## Set up

Node.js 22+, Python 3.10+ and ffmpeg; tested on macOS.

```
npm install                                                       # HyperFrames, GSAP; links skills into .claude/skills
npm run setup                                                     # .venv with Kokoro, which hyperframes tts runs
npm run doctor                                                    # what is missing, with the fix; voices one word
```

The first `doctor` downloads Kokoro into `~/.cache/hyperframes/tts` (about 340 MB). The first
render downloads a headless Chrome if HyperFrames finds none (about 190 MB).

## Commands

| Command | What it does |
|---|---|
| `npm run new -- <folder>` | A new video from `template/` (`videos/x` for this repo, `local/videos/x` for any other code base) |
| `npm run voice -- <folder>` | One Kokoro take per sentence, then `assets/narration.wav` and `timing.json` |
| `npm run build -- <folder>` | The HyperFrames composition, `index.html`, from `scenes.html` and the timing |
| `npm run check -- <folder>` | HyperFrames' own check: lint, layout, motion, caption contrast |
| `npm run preview -- <folder>` | The HyperFrames studio, to scrub through it |
| `npm run render -- <folder>` | `out/<name>.mp4`, the name taken from the folder's path (`--draft` for a fast pass) |
| `npm run make -- <folder>` | Voice, build, lint and render |
| `npm run review -- <folder>` | The critics' evidence: `review/packet.md` and `review/frames/` |
| `npm run skills` | Link new skills in `skills/` or `local/skills/` into `.claude/skills/` |
| `npm run usage` | Tokens and context per agent for the newest Claude Code session of this repo, subagents included (`-- <session id>` for another, `-- --json` for data); read from `~/.claude/projects/`, or from `CLAUDE_PROJECTS_DIR` |
| `claude plugin validate .` | The plugin manifest, marketplace entry, skills and agent; run it after any change to them. One warning is expected (no `version`, on purpose: the commit SHA versions the plugin); `--strict` fails on it |
| `npm test` | No Kokoro needed; CI runs only this |

A change to `bin/`, `kit/` or `template/` is validated by running `make` and `review` on
`videos/how-it-works` and looking at the contact sheets.

## A video's files

| File | What it is |
|---|---|
| `script/01-intro.txt`, `02-...` | One file per scene, read aloud in file-name order. A sentence ends at `.`, `!` or `?` and a space |
| `scenes.html` | One `<section data-scene="01-intro">` per script file, a `<style>` for the look, optionally a `<script>` |
| `video.json` | `title`, `voice`, `speed`, `say`, `audience`, `critics`; optional `lead`, `gap`, `tail` (seconds of pause) |
| `sources.md` | Every claim the video makes, with its source |
| `critics.md` | This video's own bar, applied by every critic |
| `brief.md` | A decision video's handoff from the agent that asked for it |
| `REVIEW.md` | The critic rounds |

**Cues.** An element with `data-cue` arrives when the voice reaches that word:
`data-cue="Kokoro"` (the first word starting "Kokoro" in that scene), `data-cue="model#2"`
(the second), `data-cue="+0.3"` (0.3 s into the scene). `data-anim` is `up` (default), `fade`,
`pop`, `left`, `right` or `grow`. The build stops on a word the scene never says, and warns
when a bare word occurs more than once. A `<script>` in `scenes.html` runs after the shared
timeline and may add GSAP tweens to `tl`; each cued element's time is its `data-at`.

**Voice.** `af_heart` is the default; `npx hyperframes tts --list` shows the rest. Non-English
voices need `espeak-ng` system-wide. `say` maps a written word to what Kokoro is told to say
(`"HyperFrames": "Hyper Frames"`); captions keep the written form. At speed 1.0 Kokoro reads
near 190 words a minute, and scenes vary by about 10% at one speed, so start at 0.8 and adjust `speed`
from the packet's words a minute (`narration-writing`).

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
bin/        voice, build, render, make, review, new, doctor, link-skills, usage; lib.mjs is shared
kit/        shell.html (canvas, captions, audio) and kit.js (the timeline), shared by every video
skills/     the explainer and development skills, critic-loop, tailor and the nine critics
template/   what npm run new copies
videos/     videos about this repo; how-it-works is the example
skills/critic-grounding/scripts/  check-excerpt.mjs, the excerpt check (run through the skill)
sample_application/  a vendored sample app (microblog, MIT) the skills are tested on; see its SOURCE.md
docs/        PRD.md and DESIGN.md (kept current); assets/ holds the README's images; the GIF is cut from out/how-it-works.mp4
test/       sentence splitting, pronunciation swaps, cue and caption timing, skill links, usage counting, the excerpt checker, the sandbox runner, the docs rule
local/      gitignored, per person (tailor skill)
```

## Traps

- **Kokoro's Python is this repo's `.venv`**, passed to `hyperframes tts` as `HYPERFRAMES_PYTHON` (`bin/lib.mjs` `ttsEnv`). A user-set `HYPERFRAMES_PYTHON` wins.
- **`requirements.txt` pins phonemizer.** kokoro-onnx 0.6.1 needs `EspeakWrapper.set_data_path`, which phonemizer 3.3 lacks. Bump the two together and run `npm run doctor`.
- **espeak-ng fails when its data path is 160 characters or longer** (measured 2026-10-17: 159 works, 160 fails). It reports a missing `.../site-packages//phontab`, not a path error. A venv deep in a temp or worktree path hits this; `doctor` checks the length.
- **No speech recognition, on purpose.** `hyperframes transcribe` built whisper.cpp and then timed out downloading its model after six minutes. Timing comes from voicing each sentence separately (`bin/voice.mjs`), so a word inside a sentence is placed by its share of the letters. Do not add an ASR step to fix a cue a few hundred milliseconds off; split the sentence or use `data-cue="+seconds"`.
- **Takes are cached by text, voice and speed** in `assets/voice/<scene>-<n>.key`. Inserting a sentence shifts every later take's number, so they re-voice; that costs about a second each.
- **Generated files are gitignored** (`videos/*/assets/`, `review/`, `index.html`, `meta.json`, `timing.json`). Never commit audio, frames or renders.
- **The name is ShipShow**, one word, two capitals; the repo is `latent-variable/shipshow` (renamed from kokoro-explainers 2026-10-17, and GitHub redirects the old address). A rename also changes the PR reviewer's allowlist (latent-git-agents `config/repos.json` and `tests/repo-allowlist.test.mjs`), or PRs stop being reviewed.
- **`hyperframes lint` warns `nested_structure_needs_subcomposition` and `timeline_track_too_dense`** on every video. Advisory: each scene is one section on one track by design. Errors still block.
- The scripts never delete files: a stale take is overwritten, never removed.

## Agent context (scope + memory)
<!-- BEGIN agent-context (managed by ~/.agents/bin/project-sync.sh) -->
- You are in **PROJECT scope** (this repo). Everything that is true across projects lives in user-scope canon (`~/.agents/AGENTS.md` + skills) and is NOT repeated here; this file holds only what is true of THIS repo.
- Project memory + shared skills: `.agents/` (gitignored). Read `.agents/memory/MEMORY.md` first.
- `.claude`/`.agents` here may be symlinks; verify with `readlink` before claiming a write landed.
- This file holds project facts only. Check with `~/.agents/bin/canon-echo.sh .`; a real exception is marked `<!-- canon-override: <rule> — <why> (date) -->`.
- Refresh infra: `~/.agents/bin/project-sync.sh .`
<!-- END agent-context -->
