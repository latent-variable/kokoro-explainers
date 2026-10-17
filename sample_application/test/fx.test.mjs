import assert from "node:assert/strict";
import { test } from "node:test";
import { minorToUsdCents, usdCentsToMinor } from "../src/fx.mjs";

test("USD cents convert to the minor units of EUR and JPY", () => {
  assert.equal(usdCentsToMinor(10000, "USD"), 10000);
  assert.equal(usdCentsToMinor(10000, "EUR"), 9200);
  assert.equal(usdCentsToMinor(10000, "JPY"), 15000); // $100 is 15,000 yen, and yen have no minor unit
});

test("a budget converts back to USD cents", () => {
  assert.equal(minorToUsdCents(9200, "EUR"), 10000);
  assert.equal(minorToUsdCents(15000, "JPY"), 10000);
});
