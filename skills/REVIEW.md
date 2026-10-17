# Red-team review of the development skills

How the skills added on `feat/repo-context-skill` were tested, what broke, and what changed.
Modelled on `videos/how-it-works/REVIEW.md`. Dates are 2026-10-17. Design consequences are in
`docs/DESIGN.md`; this file is the evidence.

## Method

Five or six fresh adversarial agents per round (one per skill group, plus a docs and plugin auditor from round 3), none seeing an earlier round or each other. Each loaded
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

| Skill group | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 | Round 6 |
|---|---|---|---|---|---|---|
| `code-context`, `evidence-standard` | 0 / 6 / 7 | 0 / 7 / 5 | 0 / 6 / 4 | 0 / 2 / 9 | see below | see below |
| `change-context` | 1 / 4 / 3 | 0 / 3 / 4 | 0 / 1 / 6 | 0 / 1 / 6 (11 traps, 11 caught, 10 by the method) | see below | see below |
| the understanding skills used to find the sample's bug | | | | | 0 / 0 / 5: found all 5 planted problems, 3 by the skills' text | |
| a whole video built from the skills (new in round 6) | | | | | | 0 / 5 / 4: **the video's answer was correct** |
| `explain-concept`, `narration-writing`, `glossary` | 0 / 7 / 4 | 0 / 2 / 5 | 0 / 1 / 8 | 0 / 3 / 6 | 0 / 5 / 6 | (in the row above) |
| `decision-brief`, `explain-handoff`, `critic-decision` | 0 / 6 / 4 | 0 / 6 / 6 | 0 / 7 / 6 | 0 / 4 / 5 (6 of 7 surfaced) | 0 / 4 / 4 (6 planted, 4 surfaced) | not re-run |
| `critic-grounding` and the scripts | 2 / 6 / 1 | 0 / 7 / 3 | 1 / 10 / 4 | 0 / 2 / 6 | 0 / 2 / 7 | **1** / 3 / 9 (all 3 earlier fixes held; 3 false passes, 4 sandbox escapes) |
| docs, merge and plugin packaging | | | 0 / 5 / 9 | 0 / 3 / 11 | 0 / 6 / 9 | 0 / 2 / 12 (92 statements, 14 wrong) |

Planted defects, by what caught them: round 1 caught none of the behaviour changes or wrong claims by the
skills' method; round 2 the `change-context` traps and 3 of 4 grounding defects; round 3 all 10
`change-context` traps (9 by the method) and 3 of 5 decision defects; round 4 11 of 11 and 10 by the
method, 6 of 7 decision defects, and 7 of 8 grounding defects by the text. Blocking findings: 3, 0, 1, 0.
The major counts for the decision and grounding groups fell in round 4 for the first time; the explain
group did not (a builder following every skill literally still produces a weak video, and the rules and
the critics disagreed about aliases). Each fix still exposes the next layer, and many round-3 and round-4
findings were bugs in recipes and scripts added the round before: the main lesson (DESIGN D19).

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
  (so cutting words does not change it), and the kit had six entrance animations (main has since added eight more).

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

## What round 4 found, and what changed

| Finding | Change |
|---|---|
| The excerpt check compared each segment alone, so a statement could be shown inside a block it is not in; piping the script to node exited 0 silently; a 200,000-line input crashed; a source holding a marker-shaped line false-failed | Segments are compared against each other for depth; the CLI is a separate file with no entry guard (`excerpt.mjs` is the library); size is capped and the loop is linear-ish with early exit; a `--marker` option and a warning; tests for each |
| The sandbox let `pbcopy` and `defaults write` through and left token files readable; it accepted `$HOME` as the scratch directory | `mach-lookup` denials, more credential paths, refuses `$HOME`, `/` and a `.git`; tests, with the clipboard test restoring the person's clipboard if it ever leaks |
| The capture format and its hash were undefined; a mismatch had no severity | `capture.mjs record` and `verify` (sidecar is the SHA-256 of the whole file); a mismatch is blocking, a missing sidecar is `unsupported`; tests. A first design hashed only the output, so a changed exit code passed: the test caught it |
| The vendored-tree recipe printed "no uncommitted edits" with an untracked file present | `verify-vendored.sh` with tests, including the untracked case; the recipe lives in a script |
| The evil-merge case: `git log -p -m` shows the merge's whole diff against one parent, so every changed value looked accounted for | `git show --cc <merge>` isolates the values that match neither parent; the reconcile step is defined; reproduced on a real evil merge first |
| A limit search gave a false "absent" (the cap is written `min(..., 100)`); route enumeration missed `@bp.get`; the archive comparison could not match | Multi-vocabulary search recipe and a wider enumeration, run on the sample; exact `ls-tree` against `find` comparison; the clone form preferred |
| Decision skills: the must-speak list contradicted the video length; "overruled claims the pick depended on" could not be filled honestly; the critic could not reach the code at the pin; the brief wrote into the target repo | `Pick rests on` in the brief makes the hand-back's overruled line mechanical; what the pick rests on is spoken, the rest may be a table row; the critic brief carries `code at pin: <path>`; an explicit output root, never inside the code base read |
| Builders were never told the excerpt rules the critic enforces; the alias exemption let a script of nothing but aliases pass three critics; the central scene could show unreadable code | `explainer-video` and `explain-concept` state the marker, ranges, gutter and two-pin rules; aliases only for sound-alike or ambiguous names, each tied to its literal by a spoken sentence, meaning still checked; the central scene explains each construct and a cost or limit is stated; `critic-clarity` checks both |
| The packet counted `Author.followers.of_type(Follower)` as one word and had no static-gap column | `bin/measure.mjs`: code counted in tokens at a slower speed, and a *Stillness* table; tested and run end to end |
| `bin/usage.mjs` printed nothing and exited 0 from a path with a space or a symlink | Real-path comparison; a test that runs it from both; a content-free fixture cut from a real subagent transcript |
| The docs rule was met in letter by a trailing space or an override on any commit; counts and the critic wording were stale; the "works in any repo" claim was overstated | Structural, count-driven rule (DESIGN D22); only three skills claimed standalone; critic described as "told, not enforced"; figures refreshed |
| The sample (microblog) needed an install the safe-running rules forbid, and did not speak to the company | Replaced by a dependency-free ad-spend pacer built by three agents in one day (DESIGN D21) |

## What round 5 found, and what changed

Round 5 added the test that matters most for the demo: an agent playing the developer, who has to find the
sample's bug using only the skills. It found all five planted problems (the units mismatch, the stale spend
from batching, the tests edited to fit, the false claims in the hand-off notes, the missing contract test); the
skills' text led it to three (the false claims, the edited tests, the missing test), and it found the units
mismatch and the stale read by reading the code. The skills make claims checkable; they did not find the bug,
and the demo should not say they did. Its verdict on relatability: "Strong. An adtech developer will recognise
a USD ledger against a local-currency budget, minor-unit confusion (yen has no cents), a batched counter that
gates a spend decision, and the passing-tests-by-parameter edit."

| Finding | Change |
|---|---|
| **Merge with main:** `origin/main` had moved four commits (speed as a multiplier, themes, review plans, importance) and reversed this branch's pace guidance | Merged; adopted main's design; withdrew D15 and the 0.8 start; dropped the critics list from the template; `critic-grounding` added to the plan's floor (`shows_code`); D24 |
| `sandbox-run.sh`: a directory name with a quote spliced into the profile string and added write access anywhere | Paths are `-D` parameters; real home from the user database; roots and ancestors of home refused; `screencapture` and `say` denied; tests with the exact attack |
| `verify-vendored.sh` said MATCH with a gitignored file, or an `--assume-unchanged` or `--skip-worktree` edit; it rewrote `.git/index` and leaked temp directories | Those cases are DIRTY; argument validation; `--no-optional-locks`; cleanup trap; tests |
| `capture.mjs`: a forged capture verified; an uppercase sidecar or a directory crashed or misreported; a newline in a command forged header lines | JSON-encoded header with the argv array; case-insensitive; exit 2 with JSON; the message says integrity only; tests |
| `check-excerpt`: a dangling `--marker` was accepted; `measure`: non-Latin text read as zero; `usage`: ambiguous prefixes picked silently | Fixed with tests. A closed stdout cannot be detected (Node reopens it as `/dev/null`): recorded as a limit |
| The packet's reading check was per element, so three simultaneous paragraphs each passed | A reading queue and a `needs` and `flag` column; tests; run end to end |
| Script paths did not resolve from where the text put the reader; `critic-grounding` named a script in another skill's folder | Every call is a full `${CLAUDE_SKILL_DIR}` path; a test checks that every named script exists and that no skill uses a bare `scripts/` path |
| Nothing required a video to answer its question or to test a claim of cause | `explain-concept`, `critic-clarity` (blocking) and `critic-accuracy`: the first scene poses the question and the last answers it; a "because" needs a `[ran]` counterfactual or an `[inferred]` tag |
| The two-pin rule keyed on any `SOURCE.md`, which the original sample has too | Keyed on a `SOURCE.md` that names an upstream commit or tree hash |
| The alias rules contradicted each other and cost about 40 words | One rule: any spoken name that differs from the code is an alias, recorded and with its literal on screen; a tie sentence only where the viewer must find the thing in code |
| A builder met the excerpt rules only when the critic enforced them | A "Showing code" block in `explainer-video` (indentation, marker, gutter not in the text node, ranges, check it yourself first) |
| Decision skills: the overruled line trusted the brief's author; a thin cost was not a fault; a narrow search confirmed a wrong absence; the output root contradicted itself | Every clause numbered, `C`, `S`, `X` namespaces; a thin cost is a brief fault; absence searches re-run case-insensitively under several names; "the code base" defined; who copies the brief; a hand-back `not ready` when critics cannot be started; an overflow rule |
| The sample's story was too tidy; its base commit named yen before currency existed; its contract test checked only one side | Two independent bugs said so; history rebuilt with a clean base; the contract test runs the campaigns together and checks both sides (USD passes, EUR and JPY are `todo`); every number in `ANSWER.md` reproduced |
| `python3` is 3.14 on a current machine and the pinned Kokoro needs 3.10 to 3.13 | `bin/setup.mjs` picks a supported interpreter; `doctor` checks it (D26) |
| The docs rule was still met in letter (a punctuation edit, an override on a merge commit, substring counts) | 40 characters of added text; override from the PR title or the last non-merge commit; whole-number counts; the PRD review date must not predate its last edit; wider trigger list; `claude plugin validate` asserted in a test |
| D13 contradicted the README on which skills are standalone; stale counts; the README footer named a domain that does not resolve | Aligned on three standalone skills; counts read from the tree; footer neutral |

## What round 6 found, and what changed

Round 6 built a whole video from the skills under main's design and checked the fixes themselves. The builder
worked out the right answer from the code and the history (both bugs, and that they are independent), and the
critic plan did list `critic-grounding` for a video that shows code. The attacker confirmed all three earlier
script fixes held, then found more in the same scripts, one of them blocking.

| Finding | Change |
|---|---|
| **Blocking:** `capture.mjs record` followed a symlink the sandboxed command planted at the capture path or its sidecar, so the host wrote an attacker-controlled file anywhere the user can write | Write to a random temporary name and rename into place (rename replaces the link); refuse if the parent directory's real path changed; a command that is missing, starts with a dash or was killed is refused, not recorded; tests with the exact attack |
| The sandbox let a command type into the caller's terminal (`TIOCSTI` through `/dev/tty`) | A new session with stdin from `/dev/null`: no controlling terminal; tested under a real pty, with the unsandboxed control injecting |
| Denying a tool by name left the capability: the screen was readable through CoreGraphics, the keychain daemon reachable, other processes' arguments readable and signalable | Denied the window server, keychain and LaunchServices daemons, signals to and inspection of other processes; the header now says plainly it is not a confidentiality boundary |
| The scratch-directory refusals accepted `~/.ssh`, `~/Library` and `/Users/Shared`, and the firmlink alias bypassed the home check; the attacker's probes left 14 empty `.sandbox-*` folders in your home, `~/.ssh`, `~/.claude` and elsewhere | Dot-directories and `~/Library` under home, `/Users/Shared` and the firmlink alias are refused before anything is created; more credential, history and shell-startup files denied; the 14 folders were found empty and removed with `rmdir` |
| `verify-vendored.sh` said MATCH under a `core.fsmonitor` hook or a submodule marked `ignore=all`, and failed in a linked worktree | Repo-local settings that hide edits are forced off, the hook is never run, the common git directory is used; tests |
| Kit: `.ss-code` drew `>=` and `===` as ligatures and collapsed indentation on a `div`; the plan dropped `critic-grounding` for a `div` block | `font-variant-ligatures: none` and `white-space: pre`; `.ss-code` sets `shows_code`; a test |
| Packet: a highlight cued on a line inside a shown block was queued as new reading (a wall of `late`); a `count` cue was photographed half-counted | A highlight or a nested line adds no reading; per-entrance settle time; `late` defined in `critic-pacing`; tests |
| The sample's own tests failed under the prescribed sandbox (`mktemp` ignores `TMPDIR`) | `replay.sh` uses an explicit template under `TMPDIR` |
| A builder had no extractor for the excerpts, and the template's two sample scenes were never said to be replaced | `extract-excerpts.mjs` (tested), `data-source` and `data-ranges` on the block, and a replace-the-template-scenes line |
| Small: `readingQueue`, `usage` and `doctor` accepted bad input; `setup` could pip-install into a wrong-version venv; `--ranges` accepted a trailing comma | Validated, with tests; `setup` refuses an out-of-range existing `.venv` (it never deletes one) |
| Docs: `validate .` was said to check skills and the agent (it checks only the two manifests); the kit line was stale; `shows_code` was undocumented; the docs rule's trigger list in prose differed from the test | Reworded; a front-matter test for every skill and the agent; documented; one list |

## Still open after round 6

- Not re-run after the round-six fixes: a seventh round. The judges are Sonnet only.
- Not fixed: `build.mjs` warns on every ambiguous cue word even when the first match is the intended one;
  stillness limits differ across `critic-pacing`, `critic-engagement` and `explainer-video` (main's numbers,
  left for its owner); the sandbox cannot be a confidentiality boundary on macOS without a different mechanism.
- Linux sandbox commands (`bwrap --unshare-net`) are not tested; the script refuses off macOS.
- `critic-grounding`'s rendered-frames check is "viewed"; the excerpt check does not see absolute indentation,
  tabs against spaces, a hidden marker or an unmarked cut at either end; a closed stdout is undetectable.
- `capture.mjs` proves integrity, not provenance; only re-running does.
- The plugin ships every tracked file, has a `bin/` and a `package.json` at its root, and was never installed on a
  clean machine (D13).
- The decision skills still rely on prose a builder can satisfy without evidence.

## Round 7

Not run. The branch went to a pull request after round six, with the open items above stated.
