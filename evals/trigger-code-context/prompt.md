---
description: "Triggering: asked how some code behaves and what it guarantees, does the agent load code-context?"
tags: [trigger]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

How does this check work, and what does it actually guarantee about a campaign's spend?

```js
export function withinBudget(campaign, ledger) {
  return ledger.spent(campaign.id) < campaign.dailyBudget;
}
```
