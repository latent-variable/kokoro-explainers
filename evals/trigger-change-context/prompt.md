---
description: "Triggering: asked to explain a diff, does the agent load change-context?"
tags: [trigger]
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Glob, Grep, Skill]
---

Explain this pull request to me: what it changes, why someone would have made it, and what it risks.

```diff
--- a/src/ledger.mjs
+++ b/src/ledger.mjs
@@ -4,3 +4,3 @@
-export const FLUSH_EVERY = 1;
+export const FLUSH_EVERY = 500;
@@ -23,3 +23,3 @@
   spent(campaignId) {
-    return flushed.get(campaignId) ?? 0 + pending(campaignId);
+    return flushed.get(campaignId) ?? 0;
   }
```
