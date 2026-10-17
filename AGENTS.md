# AGENTS.md

Start here. This file says what the project is, where everything lives, which skill to load,
and what is expected of you. `README.md` is the same story for humans.

## What this is

A pipeline that turns plain text into narrated explainer videos on one machine (a Kokoro
voice, HyperFrames scenes), and a set of skills for agents to make them well. The first use
is release explainers: a short video that keeps developers current on what changed in a
project's release and what they need to do.

## Where things are

| Path | What |
|---|---|
| `skills/` | Every skill. `npm install` links them into `.claude/skills/` for Claude Code; other agents read them here |
| `videos/<name>/` | One video: `script/`, `scenes.html`, `video.json`, `sources.md`, `critics.md`, `REVIEW.md` |
| `bin/` | The pipeline: `voice`, `build`, `render`, `make`, `review`, `new`, `doctor` |
| `kit/` | The page and timeline every video shares |
| `template/` | What `npm run new` copies |

## Skills

| Skill | Load it to |
|---|---|
| `explainer-video` | Make or update a video. You are the builder |
| `critic-loop` | Judge a video with fresh critics, fix, repeat until they pass; add a new critic |
| `critic-accuracy`, `critic-clarity`, `critic-pacing`, `critic-sync`, `critic-visuals`, `critic-consistency`, `critic-engagement` | Be one critic, when the loop assigns you |

## What is expected

- **The agent that builds a video never judges it.** Every critic is a fresh agent that has
  never seen the build: never a fork, never yourself. Its whole job is to find what is wrong.
- **A video is done when its critics pass**, not when it renders: `REVIEW.md` records each
  round. Which critics a video gets is in its `video.json`; its own bar is in `critics.md`.
- **Every claim traces to `sources.md`.** A fact the sources lack is a gap to report, never
  one to fill in.
- **A bar you keep wishing a video met becomes a critic** (`critic-loop`, *A new critic*).

## Commands

- `npm run doctor`: what the machine is missing. Run it first on a fresh clone.
- `npm test`: no Kokoro needed; CI runs only this.
- `npm run make -- videos/<name>`: the end-to-end path (voice, build, lint, render). `npm run review -- videos/<name>` then writes the critics' evidence. A change to `bin/`, `kit/` or `template/` is validated by running it on `videos/how-it-works` and looking at frames: `npx hyperframes snapshot videos/how-it-works --at <seconds>`.

## Traps

- **Kokoro's Python is this repo's `.venv`**, passed to `hyperframes tts` as `HYPERFRAMES_PYTHON` (`bin/lib.mjs` `ttsEnv`). A user-set `HYPERFRAMES_PYTHON` wins.
- **`requirements.txt` pins phonemizer.** kokoro-onnx 0.6.1 needs `EspeakWrapper.set_data_path`, which phonemizer 3.3 lacks. Bump the two together and run `npm run doctor`.
- **espeak-ng fails when its data path is 160 characters or longer** (measured 2026-10-17: 159 works, 160 fails). It reports a missing `.../site-packages//phontab`, not a path error. A venv deep in a temp or worktree path hits this; `doctor` checks the length.
- **No speech recognition, on purpose.** `hyperframes transcribe` built whisper.cpp and then timed out downloading its model after six minutes. Timing comes from voicing each sentence separately (`bin/voice.mjs`), so a word inside a sentence is placed by its share of the letters. Do not add an ASR step to fix a cue a few hundred milliseconds off; split the sentence or use `data-cue="+seconds"`.
- **Takes are cached by text, voice and speed** in `assets/voice/<scene>-<n>.key`. Inserting a sentence shifts every later take's number, so they re-voice; that costs about a second each.
- **Generated files are gitignored** (`videos/*/assets/`, `review/`, `index.html`, `meta.json`, `timing.json`). Never commit audio, frames or renders.
- **The project name is a placeholder** (2026-10-17). Do not spread `kokoro-explainers` into new files beyond what already names it; a rename is coming. A rename also changes the PR reviewer's allowlist (latent-git-agents `config/repos.json` and `tests/repo-allowlist.test.mjs`), or PRs stop being reviewed.
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
