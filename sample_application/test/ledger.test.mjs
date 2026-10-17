import assert from "node:assert/strict";
import { test } from "node:test";
import { createLedger } from "../src/ledger.mjs";

test("totals match what was recorded once the buffer is flushed", () => {
  const ledger = createLedger();
  for (let i = 0; i < 1200; i++) ledger.record("c1", 3);
  ledger.flush();
  assert.equal(ledger.spent("c1"), 3600);
});

test("the database is written once per 500 records, not once per impression", () => {
  const ledger = createLedger();
  for (let i = 0; i < 1500; i++) ledger.record("c1", 1);
  assert.equal(ledger.writes, 3);
});
