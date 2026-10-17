---
type: llm
---

PASS if the response identifies BOTH causes: (1) pacing compares the ledger's spend, in USD cents, with the budget in the campaign's own minor units, so a yen budget of 15,000 is read as 15,000 cents (150 dollars); and (2) batched ledger writes mean spent() reads only flushed spend, so pacing keeps serving after the budget is reached. FAIL if either cause is missing or wrong.
