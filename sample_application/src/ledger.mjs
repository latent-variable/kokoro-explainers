// Spend so far today, per campaign, in USD cents: what the exchange bills us in.
// Writes are batched: the database is hit once per `flushEvery` records, not once per impression.
// spent() reads what has been flushed.
export const FLUSH_EVERY = 500;

export function createLedger({ flushEvery = FLUSH_EVERY } = {}) {
  const flushed = new Map();
  let buffer = [];
  let writes = 0;

  function flush() {
    if (!buffer.length) return;
    for (const [id, cents] of buffer) flushed.set(id, (flushed.get(id) ?? 0) + cents);
    buffer = [];
    writes++;
  }

  return {
    record(campaignId, usdCents) {
      buffer.push([campaignId, usdCents]);
      if (buffer.length >= flushEvery) flush();
    },
    spent(campaignId) {
      return flushed.get(campaignId) ?? 0;
    },
    flush,
    get writes() {
      return writes;
    },
  };
}
