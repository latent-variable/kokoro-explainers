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

**Caveats.** The agents are Sonnet 5.5, the same model family as the builder, so self-preference bias
applies. The workspace limits agents to Sonnet: six Opus agents for round 3 were rejected at once with
HTTP 429 (a configured limit of one request a minute), so no Opus judge has reviewed these skills and
this record is evidence of what a Sonnet attacker finds, not proof of correctness. Rounds used
different probes, so counts are not a like-for-like score; read them as "what the next attacker
found". Agents plant their own defects, so "caught" depends on how hard they planted. One round-2
agent wrote stray files into the repo root and its parent during its own test; it removed them and the
repo was verified clean. Where a finding could be reproduced it was, before acting (the script's silent
exit 0 on a path with a space, the blank-line false fail, the empty-excerpt pass, `say` rewriting
paths, the sentence splitter, the `or stop` recipe, the unportable `\b` in `git grep -E`).

## Results

Findings are blocking / major / minor.

| Skill group | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| `code-context`, `evidence-standard` | 0 / 6 / 7 | 0 / 7 / 5 | 0 / 6 / 4 (16 claims checked, 5 wrong) |
| `change-context` | 1 / 4 / 3 | 0 / 3 / 4 | 0 / 1 / 6 (10 traps planted, 10 caught, 9 by the skill's own method) |
| `explain-concept`, `narration-writing`, `glossary` | 0 / 7 / 4 | 0 / 2 / 5 | 0 / 1 / 8 |
| `decision-brief`, `explain-handoff`, `critic-decision` | 0 / 6 / 4 | 0 / 6 / 6 | 0 / 7 / 6 (5 planted, 3 surfaced by the skill text) |
| `critic-grounding` and its script | 2 / 6 / 1 | 0 / 7 / 3 | **1** / 10 / 4 (5 planted, 3 caught; 8 script bugs) |
| docs and plugin packaging (new in round 3) | | | 0 / 5 / 9 (62 statements checked, 13 wrong) |

Planted defects, by what caught them: round 1 caught none of the behaviour changes or wrong claims by
the skills' method; round 2 caught the `change-context` traps and 3 of 4 grounding defects; round 3
caught all 10 `change-context` traps (9 by the method) and 3 of 5 decision defects. The one blocking
finding in round 3 was in a script, not a skill. The major counts have not fallen for the decision and
grounding groups: each fix exposes the next layer, and several round-3 findings were bugs in recipes I
added in round 2. That is the main lesson (DESIGN D19).

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

## What round 3 found, and what changed

| Finding | Change |
|---|---|
| **Blocking:** `check-excerpt.mjs` printed nothing and exited 0 when its path had a space or a symlink (a false pass) | Rewrote the entry guard (`realpath` on both sides); every outcome now prints or exits non-zero; tests run it from a path with a space and a symlink |
| The script failed a genuine excerpt containing a blank line, passed an empty excerpt, treated a source line `...` as a marker, normalised indentation and string interiors, reported the first of several matches, and missed decorators and early exits | Blank lines ignored; empty is `ok: false`; only `…` is a marker; relative indentation and text exact; `--ranges` required and picks among matches; flags for decorators, `abort`, `exit`, `continue`, `with`, `and`/`or`, comparisons; gaps list a preview; exit 2 on bad usage; a test for each |
| The sandbox recipe blocked only the network, broke `/dev/null` and `mktemp`, and still allowed reading `~/.ssh` and launching apps | `scripts/sandbox-run.sh`: full tested profile (`HOME` and `TMPDIR` in the copy, no network, writes confined, credential folders unreadable, `open`/`osascript` denied); refuses off macOS; a test |
| `cd <copy> \|\| stop`: `stop` is not a command, so the script carried on in the original directory | `cd "<copy>" \|\| exit 1` |
| The offline tree-hash recipe wrote into `.git` and gave a false "modified" from a subdirectory; its last line then diffed against the wrong index | Read-only recipe (redirected object directory), any directory, unsets its variables, excludes `SOURCE.md`; checked clean and dirty; object count unchanged |
| `git archive` honours `export-ignore` and can drop files; `git worktree` writes into `.git` | Faithful form is `git clone --no-hardlinks` + checkout; compare `git ls-tree` with an archive; worktree only on your own repo |
| A merge commit's own changes are invisible to `git log -p`; add-then-undo had no line form; migration heads command used an unportable `\b` | `git log -p -m` plus reconcile with the range diff; a line for added-then-removed; `git grep -nE '^(down_)?revision[ :=]'`, run and checked (18 matches on the sample) |
| Library behaviour (Flask, Werkzeug) had no tag; "all routes need a token" was wrong | `[inferred] ... from: <requirements pin>; library behaviour, not read, not run`; a claim over a set needs the enumeration as evidence |
| A decision brief's claims had no IDs; a thin cost passed; unchecked claims and the "by when" could be stated as fact; the explainer judged whether the pick held; `critic-decision` could not see the code | Claims numbered `C1`..; a cost needs a mechanism; re-run absence searches over the whole tree; trace the recommended option end to end; added and dropped options recorded; the working agent judges; `critic-decision` gets the code and re-checks `confirmed` absences |
| `Status: ready` could omit a required critic; `not ready` dropped `Read at` and `Sources` | Required critic set defined, a critic removed from `video.json` still listed; both forms carry `Read at`, `Sources`, `Stored` |
| A recorded spoken alias made captions differ from the screen, which three critics would flag major | `critic-accuracy`, `critic-consistency` and `critic-sync` exempt a recorded alias with its literal on screen |
| `say` rewrites inside paths; the sentence splitter breaks at `e.g.`; a cue on an identifier stops the build | Documented in `narration-writing`; `say` for one-meaning words only |
| Pace guidance had three starting points | One: 0.8, in `AGENTS.md`, the template (was 1.0) and `narration-writing`; `critic-pacing` says adjust `speed` first |
| The docs rule was satisfiable in letter (emptied docs, deleted section, an incidental mention all passed) | A stronger test (content, heading, skill in table and PRD, critic in `critics.svg`, plugin names) and a CI check on pull requests; both paths exercised |
| Plugin: the critic agent could not load its skill; the `version` pin; `bin/` at the plugin root; a 520 KB copy; overclaimed read-only | Agent gets the Skill tool and `${CLAUDE_PLUGIN_ROOT}` paths; no `version`; the rest documented as known limits in DESIGN D13 with what works outside a clone |

## Still open after round 3

- Linux sandbox commands (`bwrap --unshare-net`) are not tested here; the script refuses off macOS.
- `critic-grounding`'s rendered-frames check has no mechanical method: it is "viewed".
- The plugin ships every tracked file (about 520 KB) and a `bin/` at its root; restructuring into a
  subdirectory is deferred (DESIGN D13). Cross-skill references under the `/shipshow:` namespace are
  untested.
- The decision skills still depend on prose a builder can satisfy without evidence; only the claim-ID
  reconciliation is a candidate for a script.
- The kit cannot highlight a line, draw an arrow, or exit and swap an element.
- No Opus judge (the workspace is Sonnet-only), and no round-3 re-run after these fixes yet.

## Round 4

Pending: fresh agents on the fixes above.
