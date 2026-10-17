---
name: tailor
description: >
  Record how one person wants their explainers, in their own local layer (local/, never
  committed): a preference about depth, tone, voice, look or structure, a personal bar every
  one of their videos must meet, or a skill of their own. Load when someone says how they
  want explainers made for them ("open with the decision", "slower", "always show the
  code", "never tell me what you almost got wrong"), or asks to change or forget one.
---

# Tailor

The skills in `skills/` are the team's baseline: what an explainer should be for anyone.
Each person tailors on top of it in `local/`, which is gitignored and lives only on their
machine. The baseline is shared and reviewed; a preference is yours and needs no review.

```
local/
  config.json           settings the pipeline reads: {"speed": 1.4, "voice": "af_heart", "theme": "acme"}
  themes/<name>/        your clients' themes (skills/theme); never committed
  preferences.md        how you like explainers made: depth, tone, look, order
  critics.md            your bar: every critic applies it to every video you make
  skills/<name>/        your own skills and critics; npm run skills links them for Claude Code
  videos/<name>/        videos about code that is not this repo's; never committed
```

## Recording a preference

1. **Say it back in one line** and check it is what they meant.
2. **Pick where it goes.** A setting the pipeline reads (speed, voice, theme) goes in
   `config.json`; a whole look goes in a theme (`theme` skill).
   Taste (how it should feel or be ordered) goes in `preferences.md`.
   Something a video can fail, and a critic can check, goes in `critics.md` with a severity.
   A whole new way of judging goes in `local/skills/critic-<what>/`, shaped like the shared
   critics, then `npm run skills`.
3. **Write one dated line with the reason**: `- 2026-10-17: open with the decision, not the
   history. I watch these to make a call.` Replace a line it supersedes rather than adding
   a second one that contradicts it.
4. **When it would help everyone**, say so, and offer it to the baseline as a pull request
   instead. A preference three people share is a baseline gap.

## What a preference cannot do

- Relax the truth bar. `critic-accuracy` and `sources.md` hold whatever anyone prefers.
- Let the builder judge its own video.
- Tell the agent how to do what it already does well (managing its context, planning its
  steps). A rule like that becomes friction the next model has to work around; state the
  outcome you want instead. Who builds, who judges and where facts come from are bars, not
  method, and a preference does not change them.

## Precedence

Most specific wins: a video's own `video.json` and `critics.md`, then `local/`, then the
skills. A preference that conflicts with a baseline skill wins for that person's videos, and
the conflict is worth raising with the team.
