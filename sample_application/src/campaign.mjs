// A campaign has a daily budget in the minor units of its own currency:
// cents for USD and EUR, whole yen for JPY (yen has no minor unit).
export function campaign({ id, name, currency = "USD", dailyBudget }) {
  return { id, name, currency, dailyBudget };
}
