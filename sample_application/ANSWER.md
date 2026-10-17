# Spoiler: what is wrong

Read this last. A video about this app should derive all of it from the code and the history, not from
this file.

There are two independent bugs, both visible at the head, and each hand-off note is false in its own right.
The 181% is what they do together.

1. **Pacing compares two different units.** `src/pacing.mjs` compares `ledger.spent()`, which is USD cents,
   with `campaign.dailyBudget`, which is in the campaign's own minor units. Yen have no minor unit, so a budget
   of 15,000 yen (worth $100 at 150 yen to the dollar) is read as 15,000 cents ($150) and the campaign runs
   to about 150%. A euro budget of 9,200 is read as $92, so it stops about 8% early. The currency agent added
   the currency but never touched pacing, and its note says "pacing needs no change".
2. **Batching makes pacing read stale spend.** `src/ledger.mjs` flushes once per 500 records, shared across
   every campaign, and `spent()` reads only what has been flushed. Pacing keeps serving for up to a write's
   worth of impressions after the budget is gone: a dollar-only campaign reaches 105% on its own, and 111% in
   the scenario, where three campaigns share the buffer. The throughput agent's note says there is no change
   to what pacing sees, which is false.
3. **Together:** Tokyo alone, with a flush on every record, stops at 150% (the units bug); with the 500-record
   batch it reaches 175%; in the scenario, sharing the buffer with the other two campaigns that stop earlier,
   it reaches 181%. The euro campaign's units error pulls it under budget (93%), partly hiding the batching
   lag, which is why it looks the healthiest.
4. **The notes.** Pacing: "never serves past its budget" is false even with flushing on every record (the check
   runs before the bill, so it can overshoot by one impression) and was only plausible before batching and
   before currency. Throughput: false, as above. Currency: false, as above.
5. **The tests were edited to match, and none covers the interaction.** To keep its change green the throughput
   agent rebuilt the older engine and pacing tests with `flushEvery: 1`, so no test exercised pacing at the
   production batch size until the reviewer's contract test. The currency tests convert amounts and report on
   a yen campaign, but none sends a yen campaign through the engine and pacing.
6. **Nobody owned the whole.** Each change is reasonable for its task. The bugs show only in the dashboard.
   `test/budget-contract.test.mjs` is the test nobody wrote. It runs the campaigns together, as production
   does, and checks that spend lands within a write batch above the budget and 5% below it: USD passes, EUR
   (under) and JPY (over) fail, and are marked `todo`, so the suite stays green.
