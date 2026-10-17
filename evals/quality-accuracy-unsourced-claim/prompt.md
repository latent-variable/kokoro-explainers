---
description: "Quality: a narration claim that sources.md does not support; critic-accuracy should flag it."
tags: [quality, accuracy]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

Use the shipshow:critic-accuracy skill. This is all the evidence there is.

sources.md says: "C1 [ran] The Tokyo campaign ended at 181% of its budget. C2 [read] pacing compares ledger spend with the daily budget (src/pacing.mjs:3)."

The video's narration says: "The next morning, finance asks why the Tokyo campaign spent one hundred eighty-one percent of its budget. Pacing compares the ledger's spend with the daily budget."

Judge the narration as the critic would. List each finding in one line.
