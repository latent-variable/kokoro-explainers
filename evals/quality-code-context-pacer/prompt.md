---
description: "Quality: from pasted code only, find the two reasons a yen campaign can overspend, with the evidence tags and path:line the standard asks for."
tags: [quality, code-context]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

Use the shipshow:code-context skill. Nothing can be run and there is no checkout; this is every line there is, from commit dbb7e0070f66dabd670b98ff9bb4d415ed2a3c69.

src/pacing.mjs:
```
1  // Stop serving once a campaign has spent its daily budget.
2  export function withinBudget(campaign, ledger) {
3    return ledger.spent(campaign.id) < campaign.dailyBudget;
4  }
```
src/ledger.mjs (lines 1-4 and 19-25):
```
1  // Spend so far today, per campaign, in USD cents: what the exchange bills us in.
2  // Writes are batched: the database is hit once per `flushEvery` records, not once per impression.
3  // spent() reads what has been flushed.
4  export const FLUSH_EVERY = 500;
...
19   record(campaignId, usdCents) {
20     buffer.push([campaignId, usdCents]);
21     if (buffer.length >= flushEvery) flush();
22   },
23   spent(campaignId) {
24     return flushed.get(campaignId) ?? 0;
25   },
```
src/campaign.mjs:
```
1  // A campaign has a daily budget in the minor units of its own currency:
2  // cents for USD and EUR, whole yen for JPY (yen has no minor unit).
```

A Tokyo campaign with a daily budget of 15,000 yen (worth about 100 dollars) ends the day at 181 percent of budget. What in this code can explain that? Give the causes, each with its evidence.
