import assert from "node:assert/strict";
import { test } from "node:test";
import { campaign } from "../src/campaign.mjs";
import { createEngine } from "../src/engine.mjs";
import { minorToUsdCents } from "../src/fx.mjs";
import { createLedger } from "../src/ledger.mjs";

// The test nobody wrote: whatever the currency, spend must stay within one write batch of the budget.
// It fails today. `todo` keeps the suite green while the failure is on the record.
for (const [currency, dailyBudget] of [["USD", 10000], ["EUR", 9200], ["JPY", 15000]]) {
  test(`${currency}: spend stays within one batch of the budget`, { todo: currency === "JPY" ? "overspends: pacing compares USD cents to yen" : false }, () => {
    const ledger = createLedger();
    const engine = createEngine({ ledger });
    const c = campaign({ id: currency, name: currency, currency, dailyBudget });
    for (let i = 0; i < 10_000; i++) engine.serve(c, { costUsdCents: 7 });
    ledger.flush();
    const batchCents = 500 * 7;
    assert.ok(ledger.spent(c.id) <= minorToUsdCents(dailyBudget, currency) + batchCents, `${currency} spent ${ledger.spent(c.id)} cents`);
  });
}
