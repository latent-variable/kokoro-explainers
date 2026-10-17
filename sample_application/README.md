# pacer-demo

A toy **ad-spend pacer**: it serves ad impressions for a campaign and stops when the campaign has spent its
daily budget. About 80 lines of Node in `src/` (about 230 with tests and the scenario), no dependencies. It is the kind of service an adtech or martech
company runs, and it is written for the ShipShow demo.

**It is not Aperiam's code, and it does not describe Aperiam's products.** Aperiam describes itself as
"the leading adtech and martech venture capital firm", with a ventures arm that backs adtech and martech
startups, and an Ads arm doing "emerging tech orchestration for supply chain, commerce, and identity"
(see `SOURCE.md`). A budget pacer is a plausible service for one of those portfolio companies to run, and
the problem it shows is common to all of them.

## Run it

```
npm test             # every agent's tests, the replay check (needs git), and two known failures marked todo
npm run scenario     # the morning after
sh history/replay.sh # rebuild the git history in a temporary repo and print its path
```

## What happened

On Thursday three agents each took one task, in parallel. Each wrote its own tests, got them green and
handed back a short note (`agents/`). A reviewer skimmed the three notes and merged them in the order
they finished (`history/` holds the five commits as patches). Every note says its change is safe for what
it was given, and every one of those claims is false in its own way, as the dashboard shows the next
morning.

| Agent | Task | Files |
|---|---|---|
| `agent-pacing` | Stop campaigns spending past their daily budget | `src/pacing.mjs`, `src/engine.mjs` |
| `agent-throughput` | Ledger writes are the bottleneck | `src/ledger.mjs`, and two older tests |
| `agent-currency` | Launch campaigns in EUR and JPY | `src/campaign.mjs`, `src/fx.mjs`, `src/report.mjs` |

## The morning after

Three campaigns, each with a budget worth $100 a day, fed identical traffic. Amounts are in each currency's
minor units (cents for USD and EUR, whole yen for JPY), and the three campaigns share one ledger write
buffer, which is why the same bug shows differently in each:

```
campaign          budget        spent        of budget   served
US retargeting    10,000 USD    11,088 USD    111%        1584   (budget is $100.00)
EU prospecting    9,200 EUR     8,585 EUR     93%         1333   (budget is $100.00)
Tokyo launch      15,000 JPY    27,122 JPY    181%        2583   (budget is $100.00)
```

Finance asks why the Tokyo campaign spent 181% of its budget, and why the numbers differ per currency.
Every test passes (the two tests that would have caught it are marked `todo`). Every note says its own
change is safe. A person who managed those three agents has
three summaries, five commits and a dashboard that disagrees with itself.

The question a developer would have had a hard time answering: **which of the three changes is wrong, and
is anything else wrong too?** `ANSWER.md` has it, so read it last. There is more than one bug, and they
are independent: each is visible at the head and each hand-off note is false in its own right.
