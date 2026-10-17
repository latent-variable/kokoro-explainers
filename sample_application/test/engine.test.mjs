import assert from "node:assert/strict";
import { test } from "node:test";
import { campaign } from "../src/campaign.mjs";
import { createEngine } from "../src/engine.mjs";
import { createLedger } from "../src/ledger.mjs";

test("serving an impression bills the campaign", () => {
  const ledger = createLedger({ flushEvery: 1 });
  const engine = createEngine({ ledger });
  const c = campaign({ id: "c1", name: "Spring sale", dailyBudget: 10000 });
  assert.deepEqual(engine.serve(c, { costUsdCents: 7 }), { served: true });
  assert.equal(ledger.spent("c1"), 7);
});
