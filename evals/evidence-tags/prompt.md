---
description: "Triggering: asked in natural words for a line of evidence, does the agent reach for the evidence standard on its own, and do the tag, path:line and pin appear?"
tags: [trigger, evidence]
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

I did not run anything. Write the one line of evidence I would put in my notes for this claim: "pacing compares the ledger's spend with the campaign's daily budget". Reply with only that line.
