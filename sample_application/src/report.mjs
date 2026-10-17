import { usdCentsToMinor } from "./fx.mjs";

// What the dashboard shows: spend in the campaign's own currency, and how much of the budget it is.
export function report(campaign, ledger) {
  const spent = usdCentsToMinor(ledger.spent(campaign.id), campaign.currency);
  return {
    currency: campaign.currency,
    budget: campaign.dailyBudget,
    spent,
    percent: Math.round((spent / campaign.dailyBudget) * 100),
  };
}
