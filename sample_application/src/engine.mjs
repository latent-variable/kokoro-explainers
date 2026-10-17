import { withinBudget } from "./pacing.mjs";

// Serve one impression, unless the campaign is out of budget; then bill it what the exchange charged.
export function createEngine({ ledger }) {
  return {
    serve(campaign, event) {
      if (!withinBudget(campaign, ledger)) return { served: false, reason: "budget" };
      ledger.record(campaign.id, event.costUsdCents);
      return { served: true };
    },
  };
}
