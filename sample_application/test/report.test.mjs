import assert from "node:assert/strict";
import { test } from "node:test";
import { campaign } from "../src/campaign.mjs";
import { createLedger } from "../src/ledger.mjs";
import { report } from "../src/report.mjs";

test("the dashboard shows spend in the campaign's own currency", () => {
  const ledger = createLedger({ flushEvery: 1 });
  const jp = campaign({ id: "jp", name: "Tokyo launch", currency: "JPY", dailyBudget: 15000 });
  ledger.record("jp", 5000); // $50
  assert.deepEqual(report(jp, ledger), { currency: "JPY", budget: 15000, spent: 7500, percent: 50 });
});
