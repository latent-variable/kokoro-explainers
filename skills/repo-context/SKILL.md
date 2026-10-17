---
name: repo-context
description: >
  (Only in the ShipShow repo itself.) Get oriented in this repo before changing it: what it is, where each piece lives, how to
  run and test it, which traps have bitten before, and how a change is validated. Load at
  the start of any development task here (fixing a bug, changing `bin/`, `kit/`, `template/`
  or a skill, adding a feature), when asked "how does this repo work", or when handing a
  development task to a fresh agent.
---

# Repo context

Development, not video-making: to make a video, load `explainer-video`. To understand requirements and behaviour in depth
(this or any other code base), load `code-context`. This skill gets you
to the point of changing the code safely. It points at the sources of truth instead of
restating them, because a copy goes stale and the code does not.

## Where the truth is

You know your own way of reading a repo; these are the sources worth reaching for before you change code.

- `AGENTS.md`: what the project is, where things are, what is expected, the traps. The
  traps are the point; each one cost someone time.
- `README.md`: the short human story. The `data-cue` and `video.json` reference, the commands and the layout are in `AGENTS.md`.
- `.agents/memory/MEMORY.md` when it exists (gitignored project memory).
- `git log --oneline -15`: what changed lately and why. Commit subjects here are
  `type: summary (#PR)`.
- The files you will touch and their neighbours. `bin/` is about 640 lines in total:
  the step you change and the ones around it are what matter.

## The shape

The pipeline is text in, MP4 out: `voice` (Kokoro, one sentence at a time, writes
`timing.json`) then `build` (`scenes.html` plus `kit/` into `index.html`) then `lint` then
`render`; `review` writes the critics' evidence. `bin/make.mjs` chains the first four, so
read it first to see the order. `bin/lib.mjs` holds the shared paths and the Kokoro
environment.

Skills live in `skills/<name>/SKILL.md` and are linked into `.claude/skills/` by
`npm run skills`. `local/` is per person, gitignored, and never committed.

## Before you change anything

Know three things, by whatever route you like: what the machine lacks (`npm run doctor` names it, with the
fix), whether the tests pass now (`npm test` needs no Kokoro and is the only thing CI runs), and that you are
on a feature branch, never `main`.

## Validate the change

| You changed | Prove it with |
|---|---|
| Pure logic in `bin/` | A test in `test/pipeline.test.mjs`, then `npm test` |
| `bin/`, `kit/`, `template/` | `npm run make -- videos/how-it-works`, then look at frames: `npx hyperframes snapshot videos/how-it-works --at <seconds>` |
| A skill | `npm run skills`, then check it is linked and that its description says when to load it |
| Docs | Every command and path you wrote exists as written |

Say what you ran and what you saw. Tests passing does not show a video still looks right;
frames do. If you could not run something (no Kokoro on this machine), say so rather than
implying it passed.

## Conventions

- Match the surrounding code's idiom and comment density. The scripts are small, plain
  Node ESM with no framework.
- Generated files are gitignored. Never commit audio, frames, renders, `index.html`,
  `meta.json` or `timing.json`.
- The scripts never delete files. Do not add deletion.
- The name is ShipShow (`AGENTS.md`, traps). Use it in new files; the old name `kokoro-explainers` only survives in history.
- A video about another code base goes in `local/videos/`: this repo is public.
- Do not add speech recognition to fix a cue's timing (`AGENTS.md`, traps).
- If a trap you hit is not in `AGENTS.md`, add it there in the same change, with the date
  and how you measured it.

## Handing development work to a fresh agent

Give it the goal and the files to read, this skill's name, and what you have ruled out.
Do not give it your conclusion to confirm. It reads the code at the commit you name; the
brief can be wrong, the code is the ground truth.
