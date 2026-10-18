# Evals

Cases for `claude plugin eval` (Claude Code 2.1.269 or later): each is a prompt a person might type plus graders, run three times
with the ShipShow plugin loaded and three times with no plugin, so the difference (`Δ`) is what the plugin adds. Run them from the
repo root:

```
npm run evals                      # the whole suite: about 12 cases, 70 runs, about $2.50 and 3 minutes on Sonnet
npm run evals -- --tag trigger     # only the cases that ask whether a skill fires on natural words
npm run evals -- --case 'quality-*' --runs 5
```

`npm run evals` passes `--no-publish` (the HTML report stays under `evals/results/`, which is gitignored), `--trust-plugin` (it is
this repo's own plugin) and `--max-cost-usd 15`. Every run is a full Claude session on your own credential, so it counts against
your plan or bill.

## The cases

| Kind | What it asks | Graders |
|---|---|---|
| `trigger-*`, `evidence-tags` | A task in natural words, no skill named: does the agent load the right skill on its own? | `tool_used: Skill` (counted as an indicator, not a score, in a two-arm run), plus regexes on the answer for `evidence-tags` |
| `quality-*`, `evidence-tags-named` | The skill is named in the prompt: is the answer better than a bare agent's? | regexes first (a tag, a `path:line`, a pin, a number written as it is said), then one `llm` grader written as PASS and FAIL conditions |

Cases come from this project's own failures (`skills/REVIEW.md`, the round-2 findings of `videos/pacer-dev-journey`): a code
excerpt that differs by a number, lines dropped without a gap marker, a narration claim the sources do not support, a yen budget
read as cents. Each run starts in an empty directory with only the plugin, so the code a case needs is in the prompt.

## What the suite found (2026-10-17, Sonnet, three runs a case, the descriptions as they are now)

| Case | with plugin | without | Δ | skill fired |
|---|---|---|---|---|
| `evidence-tags` (natural words) | 1.00 | 0.67 | +0.33 | 3/3 |
| `evidence-tags-named` | 1.00 | 0.50 | +0.50 | 3/3 |
| `quality-accuracy-unsourced-claim` | 1.00 | 1.00 | +0.00 | 3/3 |
| `quality-code-context-pacer` | 1.00 | 0.58 | +0.42 | 3/3 |
| `quality-grounding-doctored-excerpt` | 1.00 | 1.00 | +0.00 | 3/3 |
| `quality-grounding-silent-gap` | 1.00 | 1.00 | +0.00 | 3/3 |
| `quality-narration-numbers` | 1.00 | 0.83 | +0.17 | 3/3 |
| `trigger-change-context` | 0.33 | 0.00 | +0.33 | 1/3 |
| `trigger-code-context` | 0.00 | 0.00 | +0.00 | 0/3 |
| `trigger-critic-loop` | 1.00 | 0.00 | +1.00 | 3/3 |
| `trigger-decision-brief` | 1.00 | 0.00 | +1.00 | 3/3 |
| `trigger-narration` | 0.67 | 0.00 | +0.67 | 2/3 |

Read it as: **the understanding skills help a lot when they load** (`code-context` +0.42, the evidence standard +0.33 to +0.50) **and often
do not load** on a plain question (`trigger-code-context` fired 0 of 3 here and on every variant tried; `change-context` 1 of 3; the evidence
standard 3 of 3 on this wording and 0 of 3 on a rewritten one). **The critic skills add nothing measurable on these cases**: a bare Sonnet agent also catches a changed
number, a dropped line and an unsupported claim, so these cases cannot yet show a critic earning its tokens (plan step 5.2); they
are regression tests, and harder planted defects are the next cases to write.

### The description experiment

Trigger-first descriptions ("Use when ...", from Anthropic's skills docs) were tried on all 22 skills and measured here at 5 to 8
runs a cell: the evidence standard fired 19 of 21 runs on the old text and 6 of 16 on the rewrite; `narration-writing` 18 of 21
against 7 of 16; `change-context` 14 of 21 against 4 of 16. The rewrite was reverted (DESIGN D41). To reproduce, put a description
variant in a worktree, copy `evals/` in, and run `npm run evals -- --tag trigger --ablation none --runs 8`.

## Writing a case

`claude plugin eval init --bare <name>` writes a blank one. Keep the YAML front matter quoted where a description has a colon.
Prefer a deterministic grader (`regex`, `tool_used`) and use an `llm` grader only for a judgement, written as PASS and FAIL
conditions; a rubric that also penalises extra findings fails correct answers (the first accuracy case did, and was rewritten).
Check what the agent actually said before trusting a score: `--keep-temp` leaves `out/trace.jsonl` for each run.

## Not in CI

The suite spends money and varies between runs, so it is run by hand when a skill, a description or the critic agent changes.
Gating CI on it needs `--threshold`, a pinned `--model` and `--judge-model`, and a budget; do that once the scores are stable.
