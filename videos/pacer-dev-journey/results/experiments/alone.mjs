const [id, cur, budget, flush] = process.argv.slice(2);
const run = async () => {
  const { campaign } = await import(process.cwd() + "/src/campaign.mjs");
  const { createEngine } = await import(process.cwd() + "/src/engine.mjs");
  const { createLedger } = await import(process.cwd() + "/src/ledger.mjs");
  const { report } = await import(process.cwd() + "/src/report.mjs");
  const c = campaign({ id, name: id, currency: cur, dailyBudget: Number(budget) });
  const ledger = createLedger({ flushEvery: Number(flush) });
  const engine = createEngine({ ledger });
  for (let i = 0; i < 10000; i++) engine.serve(c, { costUsdCents: 7 });
  ledger.flush();
  const r = report(c, ledger);
  console.log(`${cur} alone, flushEvery ${flush}: spent ${r.spent} of ${r.budget} ${cur} = ${r.percent}%`);
};
run();
