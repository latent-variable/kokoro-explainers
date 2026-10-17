# Red-team review of the development skills

How the skills added on `feat/repo-context-skill` were tested, what broke, and what changed.
Modelled on `videos/how-it-works/REVIEW.md`. Dates are 2026-10-17. Design consequences are in
`docs/DESIGN.md`; this file is the evidence.

## Method

Five fresh adversarial agents per round, none seeing an earlier round or each other. Each loaded
one skill group, applied it to `sample_application/` (microblog) and then attacked it: verified its
own claims against the code, planted defects of its own and checked whether the skill's method
caught them, and looked for ambiguity, contradiction, unsafe steps and ways to follow the skill
literally and still do badly. Each returned JSON findings with severities; a verdict is `fail` on
any blocking or major finding. They worked read-only on the repo, in scratch space under `/tmp`.

**Caveats.** The agents are the same model family as the builder (Sonnet 5.5), so self-preference
bias applies and an Opus round is worth running before a public release. Round 2 agents chose
different probes from round 1, so counts are not a like-for-like score; read them as "what the
next attacker found". Agents plant their own defects, so "caught" depends on how hard they
planted. One round-2 agent wrote stray files into the repo root and its parent during its own
test; it removed them and the repo was verified clean (`git status`, `ls`).

## Results

Findings are blocking / major / minor.

| Skill group | Round 1 | Round 2 | Planted defects, round 1 | Planted defects, round 2 |
|---|---|---|---|---|
| `code-context` | 0 / 6 / 7 | 0 / 7 / 5 | 14 claims checked, 1 wrong | 16 checked, 4 wrong |
| `change-context` | 1 / 4 / 3 | 0 / 3 / 4 | hidden behaviour change **not** caught | 3 of 3 traps and the two-heads migration caught |
| `explain-concept`, `narration-writing`, `glossary` | 0 / 7 / 4 | 0 / 2 / 5 | n/a | n/a |
| `decision-brief`, `explain-handoff` | 0 / 6 / 4 | 0 / 6 / 6 | neither wrong claim nor hidden cost surfaced | wrong claim surfaced; thin cost and unchecked assumption not |
| `critic-grounding` | 2 / 6 / 1 | 0 / 7 / 3 | 3 of 3 caught, none by the skill's method | 4 of 4 caught, 3 by the skill's method |
| Round 3 | pending | | | |

Blocking findings fell from 3 to 0. The major counts moved little for four groups; the fixes
closed the old gaps and each new attacker found the next layer. The two groups that changed most,
`change-context` and `critic-grounding`, now catch planted defects by their own method.

## What round 1 changed

- **A shared `evidence-standard`.** Four tags, a pin, safe running, absence claims, where results go,
  because the same five gaps appeared in four skills.
- **`change-context`:** a commit's label is a claim, not evidence; read every hunk; run tests at
  base and head; a migration check; "Why: not stated" instead of a reconstructed motive.
- **`critic-grounding`:** a per-asset method, a verdict that cannot be `pass` with an
  unsupported asset, ownership split from `critic-accuracy`.
- **`decision-brief`, `explain-handoff`:** claims checked by ID, costs derived from the code, an
  assumption required, a `Status:` line, every required critic listed.
- **`narration-writing`, `glossary`, `explain-concept`:** pace rules; a spoken alias; a false
  premise corrected in scene 1; numbers moved to the critics.
- Verified two agent claims before acting: `bin/review.mjs` measures speech-only words a minute
  (so cutting words does not change it), and the kit has only six entrance animations.

## What round 2 found, and what changed

Round 2 mostly found places where round 1's own fixes contradicted each other or could not be
followed.

| Finding | Change |
|---|---|
| `git worktree add` writes into the source repo's `.git`, against "never write in the target" | Scratch clone or `git archive` copy; worktree only on a repo you own |
| Tests, migration heads and every Flask output need an install the skills forbid; an agent cannot ask | Default is "not run: deps not installed" plus a static fallback for heads; install only into a temp venv if the caller approved |
| "No network" had no mechanism; `env -i` does not block it; `cp -R` carries a `.env`; a failed `cd` wrote into the real repo | Tested `sandbox-exec` on macOS (network denied; writes confined to the real path); `cd <copy> \|\| stop`; delete `.env`, `.git`, local databases; dead service URLs. Linux commands are listed untested |
| The pin rule was ambiguous and unverifiable offline for vendored code | Two labelled pins; `SOURCE.md` now holds the upstream tree hash and an offline command (verified byte-identical to upstream `a975ef6`) |
| An ordered-subsequence check accepts a splice and a harmful trim | `skills/critic-grounding/scripts/check-excerpt.mjs`: each segment contiguous in file order, matched ranges equal stated ones, gaps listed and flagged for guards, with tests |
| Capture files were self-asserted | Output hash, full output with failures, and "cannot re-run" makes the asset `unsupported` |
| `critic-loop`'s JSON had no place for the per-asset table | Optional `assets` array |
| The thin cost, the unchecked assumption and an unsupported brief option slipped past | Explainer derives costs with `path:line`; `Not verified` is required; `critic-decision` accepts a recorded dropped option and requires costs derived, assumptions and contradictions spoken, and the pick attributed to the working agent |
| A ready hand-back could hide a critic that did not run | `Status: ready` only when every required critic passed; brief vs code by claim ID; a `not ready` form that still carries the findings |
| My pace formula (190 times speed) was wrong: the repo's own `REVIEW.md` shows a 19% spread between scenes | Choose `speed` from the packet, start near 0.8; reword an outlier scene |
| `say` cannot disambiguate across scenes and breaks caption and cue timing | Write the alias in the script; `say` only for pure pronunciation; cue matching described as a prefix across the scene |
| The three explain skills prescribed a method and copied numbers | Marked as suggestions; numbers live in the critics |
| A script can follow every skill and never show or name the code a developer would open | Last scene names the file and function; a feature video shows a real excerpt |
| Placement rules disagreed with `AGENTS.md` | One rule: this repo and the vendored sample in `videos/`; everything else, and every decision video, in `local/` |

## Still open after round 2

- Linux sandbox commands (`unshare -n`, `bwrap --unshare-net`) are not tested here.
- The rendered-frames check in `critic-grounding` has no mechanical method: it is "viewed".
- A dishonest builder can still fabricate a capture that re-runs identically only if the command
  is deterministic and runnable; otherwise the asset is `unsupported` and a human decides.
- The kit cannot highlight a code line, draw an arrow, or exit and swap an element; scenes that
  need them need a custom script. This is a code change, not a skill change.
- The template ships `speed: 1.0`, which is about 190 words a minute and fails `critic-pacing`.
- Opus has not judged any round.

## Round 3

Pending. Fresh agents, new probes, run against the skills as they stand after the round-2 fixes.
