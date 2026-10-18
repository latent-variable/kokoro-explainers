---
description: "Quality when the skill is named: with the evidence standard loaded, the line carries the tag, the path:line and the pin. A bare agent is the baseline."
tags: [quality, evidence]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

I read this file at commit dbb7e0070f66dabd670b98ff9bb4d415ed2a3c69, path sample_application/src/pacing.mjs:

```
1  // Stop serving once a campaign has spent its daily budget.
2  export function withinBudget(campaign, ledger) {
3    return ledger.spent(campaign.id) < campaign.dailyBudget;
4  }
```

I did not run anything. Use the shipshow:evidence-standard skill. Write the one line of evidence I would put in my notes for this claim: "pacing compares the ledger's spend with the campaign's daily budget". Reply with only that line.
