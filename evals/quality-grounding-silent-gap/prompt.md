---
description: "Quality: lines are left out of a code excerpt with no gap marker, which hides a guard; critic-grounding should not call it genuine."
tags: [quality, grounding]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

Use the shipshow:critic-grounding skill. A video shows this code, labelled "src/pacing.mjs:4-7", as three lines on screen:

```
export function withinBudget(campaign, ledger) {
  return ledger.spent(campaign.id) < campaign.dailyBudget;
}
```

The file at the pinned commit has, at lines 4 to 7:

```
export function withinBudget(campaign, ledger) {
  if (campaign.paused) return false;
  return ledger.spent(campaign.id) < campaign.dailyBudget;
}
```

Judge the excerpt as the critic would, in two or three sentences.
