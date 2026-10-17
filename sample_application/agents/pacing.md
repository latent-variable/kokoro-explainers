# Hand-off: pacing agent (Thursday 2026-10-15, 10:00)

**Task:** stop campaigns from spending past their daily budget.

**What I changed**
- `src/pacing.mjs` (new): `withinBudget(campaign, ledger)` is true while `ledger.spent(campaign.id)` is below `campaign.dailyBudget`.
- `src/engine.mjs`: `serve()` checks it before billing and refuses with `reason: "budget"`.

**Tests:** `test/pacing.test.mjs` (2 new). All 3 tests pass.

**Notes:** pacing is exact: a campaign never serves past its budget. No other behaviour changes.
