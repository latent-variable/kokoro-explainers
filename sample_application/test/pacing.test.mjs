import assert from "node:assert/strict";
import { test } from "node:test";
import { campaign } from "../src/campaign.mjs";
import { createEngine } from "../src/engine.mjs";
import { createLedger } from "../src/ledger.mjs";

test("a campaign stops serving once it has spent its daily budget", () => {
  const ledger = createLedger({ flushEvery: 1 });
  const engine = createEngine({ ledger });
  const c = campaign({ id: "c1", name: "Spring sale", dailyBudget: 1000 });
  for (let i = 0; i < 10; i++) assert.equal(engine.serve(c, { costUsdCents: 100 }).served, true);
  assert.deepEqual(engine.serve(c, { costUsdCents: 100 }), { served: false, reason: "budget" });
  assert.equal(ledger.spent("c1"), 1000);
});

test("a campaign under budget keeps serving", () => {
  const ledger = createLedger({ flushEvery: 1 });
  const engine = createEngine({ ledger });
  const c = campaign({ id: "c2", name: "Brand", dailyBudget: 1000 });
  assert.equal(engine.serve(c, { costUsdCents: 999 }).served, true);
  assert.equal(engine.serve(c, { costUsdCents: 1 }).served, true);
  assert.equal(engine.serve(c, { costUsdCents: 1 }).served, false);
});
