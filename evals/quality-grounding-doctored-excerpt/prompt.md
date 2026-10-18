---
description: "Quality: a code excerpt shown in a video differs from its source by one number; critic-grounding should say it is not genuine."
tags: [quality, grounding]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

Use the shipshow:critic-grounding skill. A video shows this code excerpt, labelled "src/ledger.mjs:4":

```
export const FLUSH_EVERY = 50;
```

The file at the pinned commit has, at line 4:

```
export const FLUSH_EVERY = 500;
```

Judge the excerpt as the critic would, in two or three sentences, and say what the narration may not claim because of it.
