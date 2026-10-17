// Stop serving once a campaign has spent its daily budget.
export function withinBudget(campaign, ledger) {
  return ledger.spent(campaign.id) < campaign.dailyBudget;
}
