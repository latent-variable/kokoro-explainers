---
type: llm
---

PASS if the response notices that the shown excerpt silently drops the `if (campaign.paused) return false;` line (line 5) with no gap marker, and says the excerpt is therefore not a faithful contiguous copy (trimmed, misleading, or not genuine). FAIL if it calls the excerpt genuine or fine, or never notices the missing line.
