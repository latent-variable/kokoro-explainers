# Hand-off: currency agent (Thursday 2026-10-15, 14:00)

**Task:** launch campaigns in EUR and JPY.

**What I changed**
- `src/campaign.mjs`: a campaign now has a `currency`; its `dailyBudget` is in that currency's minor units (cents for EUR, whole yen for JPY).
- `src/fx.mjs` (new): fixed demo rates, each currency's minor-unit digits, and conversions both ways.
- `src/report.mjs` (new): the dashboard shows spend in the campaign's own currency and as a percentage of its budget.

**Tests:** `test/fx.test.mjs` and `test/report.test.mjs` (3 new). All 8 tests pass.

**Notes:** pacing needs no change: it already compares spend with the daily budget.
