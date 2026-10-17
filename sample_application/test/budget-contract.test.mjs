import assert from "node:assert/strict";
import { test } from "node:test";
import { campaign } from "../src/campaign.mjs";
import { createEngine } from "../src/engine.mjs";
import { minorToUsdCents } from "../src/fx.mjs";
import { createLedger } from "../src/ledger.mjs";

// The test nobody wrote. Campaigns share one ledger in production, so this runs them together, as the
// scenario does. A campaign with a $100 budget and plenty of traffic should end up spending about $100:
// not noticeably less, and not more than the traffic that can arrive between two ledger writes.
// Two of the three fail today. `todo` keeps the suite green while the failures are on the record.
const BATCH = 500;   // the ledger's records per write, shared across campaigns
const COST = 7;      // USD cents per impression
const campaigns = [
  campaign({ id: "us", name: "US", currency: "USD", dailyBudget: 10000 }),
  campaign({ id: "eu", name: "EU", currency: "EUR", dailyBudget: 9200 }),
  campaign({ id: "jp", name: "JP", currency: "JPY", dailyBudget: 15000 }),
];
const ledger = createLedger();
const engine = createEngine({ ledger });
for (let i = 0; i < 10_000; i++) for (const c of campaigns) engine.serve(c, { costUsdCents: COST });
ledger.flush();

for (const c of campaigns) {
  const budget = minorToUsdCents(c.dailyBudget, c.currency);
  const lag = Math.ceil(BATCH / campaigns.length) * COST; // what can arrive between two writes
  test(`${c.currency}: spend lands within a write batch above the budget and 5% below it`, { todo: c.currency === "USD" ? false : "fails today" }, () => {
    const spent = ledger.spent(c.id);
    assert.ok(spent >= budget * 0.95, `${c.currency} spent ${spent} of ${budget} cents: under budget`);
    assert.ok(spent <= budget + lag, `${c.currency} spent ${spent} of ${budget} cents: over budget by more than one write`);
  });
}
