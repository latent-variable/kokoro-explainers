// The morning after: three campaigns, each with a budget worth $100 a day, fed the same traffic.
// Run: npm run scenario
import { campaign } from "../src/campaign.mjs";
import { createEngine } from "../src/engine.mjs";
import { minorToUsdCents } from "../src/fx.mjs";
import { createLedger } from "../src/ledger.mjs";
import { report } from "../src/report.mjs";

const COST = 7; // USD cents per impression
const EVENTS = 10_000;
const campaigns = [
  campaign({ id: "us", name: "US retargeting", currency: "USD", dailyBudget: 10000 }), // $100.00
  campaign({ id: "eu", name: "EU prospecting", currency: "EUR", dailyBudget: 9200 }), // 92.00 EUR = $100
  campaign({ id: "jp", name: "Tokyo launch", currency: "JPY", dailyBudget: 15000 }), // 15,000 yen = $100
];

const ledger = createLedger();
const engine = createEngine({ ledger });
const served = Object.fromEntries(campaigns.map((c) => [c.id, 0]));
for (let i = 0; i < EVENTS; i++) {
  for (const c of campaigns) if (engine.serve(c, { costUsdCents: COST }).served) served[c.id]++;
}
ledger.flush();

console.log("campaign          budget        spent        of budget   served");
for (const c of campaigns) {
  const r = report(c, ledger);
  const budgetUsd = minorToUsdCents(c.dailyBudget, c.currency) / 100;
  console.log(
    `${c.name.padEnd(16)}  ${`${r.budget.toLocaleString("en-US")} ${r.currency}`.padEnd(12)}  ` +
      `${`${r.spent.toLocaleString("en-US")} ${r.currency}`.padEnd(12)}  ${`${r.percent}%`.padEnd(10)}  ${served[c.id]}   (budget is $${budgetUsd.toFixed(2)})`,
  );
}
