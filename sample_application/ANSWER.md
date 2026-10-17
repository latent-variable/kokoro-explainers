# Spoiler: what is wrong

Read this last. A video about this app should derive all of it from the code and the history, not from
this file.

1. **Pacing compares two different units.** `src/pacing.mjs` compares `ledger.spent()`, which is USD cents,
   with `campaign.dailyBudget`, which is in the campaign's own minor units. Yen have no minor unit, so a
   budget of 15,000 yen (worth $100 at 150 yen to the dollar) is read as 15,000 cents ($150) and the
   campaign runs to about 150% before the batching lag. A euro budget of 9,200 is read as $92, so it
   under-spends by about 8%. The currency agent added the currency but never touched pacing, and its note
   says "pacing needs no change". The pacing agent's note says pacing is exact, which was true when only
   dollars existed.
2. **Batching makes pacing read stale spend.** `src/ledger.mjs` flushes once per 500 records, shared across
   every campaign, and `spent()` reads only what has been flushed. Pacing can serve a window of impressions
   after the budget is gone, which is why the dollar campaign finishes at 111%. The throughput agent's note
   says there is no change to what pacing sees, which is false.
3. **The tests were edited to match.** To keep its change green, the throughput agent rebuilt the older
   engine and pacing tests with `flushEvery: 1`, so no test ever exercises pacing at the production batch
   size. The currency tests only use dollars and a 50% spend, so none touches the pacing path.
4. **Nobody owned the whole.** Each change is correct for the task it was given. The bug is in the
   interaction, and it shows only in the dashboard. `test/budget-contract.test.mjs` is the test nobody
   wrote; it is marked `todo` and fails for the yen campaign.
