// Fixed demo rates. `perUsd` is how many units of the currency one US dollar buys;
// `digits` is how many decimal places its minor unit has (USD cents: 2, JPY: 0).
export const CURRENCIES = {
  USD: { perUsd: 1, digits: 2 },
  EUR: { perUsd: 0.92, digits: 2 },
  JPY: { perUsd: 150, digits: 0 },
};

// Convert USD cents into the minor units of another currency.
export function usdCentsToMinor(usdCents, currency) {
  const { perUsd, digits } = CURRENCIES[currency];
  return Math.round((usdCents / 100) * perUsd * 10 ** digits);
}

// Convert a budget in a currency's minor units into USD cents.
export function minorToUsdCents(minor, currency) {
  const { perUsd, digits } = CURRENCIES[currency];
  return Math.round((minor / 10 ** digits / perUsd) * 100);
}
