# Sources: the developer's afternoon with the pacer

**Source of record.** `sample_application/` (original code written for ShipShow; `SOURCE.md` says it is not Aperiam's) at
repo commit `dbb7e0070f66dabd670b98ff9bb4d415ed2a3c69` (`origin/main` after #17). One pin: the code is original, so there
is no upstream. Runs are in throwaway copies of that commit made with `git archive`, recorded with `capture.mjs`
(`review/*.txt`, each with a `.sha256`, pin in the header). `ANSWER.md` was read last and used only to check the
conclusions below against the code and the runs; the video does not quote it.

## Terms
- **Spend, spent:** USD cents the exchange billed (`src/ledger.mjs:1`).
- **Budget:** the campaign's daily budget in the minor units of its own currency (`src/campaign.mjs:1-2`).
- **Batch:** the ledger's 500 records per database write, shared by every campaign (`src/ledger.mjs:4`).
- **Contract test:** `test/budget-contract.test.mjs`, which runs the three campaigns together.

## Claims
Tags: `[read]` read at the pin, `[ran]` run in a copy of the pin.

- **C1** `[ran]` The morning after: US 111%, EU 93%, Tokyo 181% of a budget worth $100 each. `review/scenario-before.txt:8-10`.
- **C2** `[read]` The three hand-off notes say: pacing "is exact: a campaign never serves past its budget" (`sample_application/agents/pacing.md:11`); "No change to what pacing or the dashboard sees" (`agents/throughput.md:11`); "pacing needs no change: it already compares spend with the daily budget" (`agents/currency.md:12`). Every test passed when they were written: "All 3 tests pass", "All 5 tests pass", "All 8 tests pass".
- **C3** `[read]` Pacing compares `ledger.spent(campaign.id)` with `campaign.dailyBudget`. `src/pacing.mjs:3`.
- **C4** `[read]` `ledger.spent` is in USD cents (`src/ledger.mjs:1`); `dailyBudget` is in the campaign's own minor units, whole yen for JPY (`src/campaign.mjs:1-2`).
- **C5** `[read]` 15,000 yen is $100: JPY is 150 per dollar with 0 decimal digits (`src/fx.mjs:6`), so `minorToUsdCents(15000, "JPY")` is 10,000 cents. Pacing reads 15,000 as 15,000 cents, $150.
- **C6** `[ran]` Tokyo alone with a write on every record stops at 150%: 22,502 of 15,000 yen. `review/alone-jp-JPY-15000-1.txt:7`.
- **C7** `[read]` The ledger writes once per 500 records, shared by every campaign (`src/ledger.mjs:4,21`), and `spent` returns only what has been flushed (`src/ledger.mjs:24`).
- **C8** `[ran]` The US campaign alone, with batching, reaches 105% (10,500 of 10,000 cents); with a write on every record, 100%. `review/alone-us-USD-10000-500.txt:7`, `review/alone-us-USD-10000-1.txt:7`.
- **C9** `[ran]` Tokyo alone with batching reaches 175% (26,250 yen). `review/alone-jp-JPY-15000-500.txt:7`. In the scenario, sharing the batch with the other two, it reaches 181% (C1).
- **C10** `[read]` The throughput agent rebuilt the older tests with `flushEvery: 1`: `test/engine.test.mjs:8`, `test/pacing.test.mjs:8,17`, `test/report.test.mjs:8` (its note, `agents/throughput.md:8`, says so). No test runs pacing at the production batch size, except the contract test.
- **C11** `[ran]` The contract test runs the three campaigns together; USD passes, EUR and JPY fail and are marked `todo`, so the suite stays green. `review/tests-before.txt:9,15,37`. EUR spent 9,331 of 10,000 cents (under); JPY 18,081 (over): `review/tests-before.txt:21,43`.
- **C12** `[ran]` With the fix (below) the same scenario ends at 100% for all three: US 10,003 USD, EU 9,203 EUR, Tokyo 15,005 JPY. `review/scenario-after.txt:8-10`. The few cents over are one impression, since the check happens before the bill (`src/engine.mjs:7-8`).
- **C13** `[ran]` The fix is two changes: pacing compares against `minorToUsdCents(campaign.dailyBudget, campaign.currency)`, and `spent` adds the records still in the buffer. `review/fix-diff.txt:22-25,38-39`. With the `todo` marks removed the contract test passes (3 of 3).
- **C14** `[inferred]` Each note was true for its own task; the failures live in the interaction, and nobody owned the whole. Basis: C2 to C11.

## Shown assets
| Where | Shows | From |
|---|---|---|
| scene 03 | `sample_application/src/pacing.mjs` lines 2-4 | the pin |
| scene 04 | `sample_application/src/ledger.mjs` lines 4, then 21-24; the gap omits lines 5-20 (the rest of `createLedger`: the map, the buffer and `flush()`) | the pin |
| scene 05 | `sample_application/test/pacing.test.mjs` line 8 | the pin |
| scene 06 | `review/fix-diff.txt` line 39 (the changed comparison); the buffer change (lines 22-25) is said, not shown; the three 100% rows are `review/scenario-after.txt` lines 8-10, and "3 of 3 pass" is the contract test with its `todo` marks removed (C13) | captures |

## The fix is a proposal, not a commit
The fix was applied only in a scratch copy (`/tmp/pacer-scratch/fixed`), not to `sample_application/`, which stays as the demo. In that copy
the history-replay test (`test/history.test.mjs`) fails, as it should, because the tree no longer equals the replayed history.

## Left out, and why
- `src/report.mjs` and the dashboard's conversion: correct, and not part of either cause.
- That one impression can overshoot because the check runs before the bill: mentioned once in scene 06 as the cents over, not explained.
- The five commits as patches (`history/`) and how the reviewer merged them: the video starts at the dashboard.
- Alternatives to the fix (flush on every record, or a per-campaign buffer): a decision video's job; this one shows the fix that passes the contract test.
