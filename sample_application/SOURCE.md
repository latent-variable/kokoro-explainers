# Source: pacer-demo

Written for the ShipShow demo, 2026-10-17: original code, MIT licensed like this repository. It is **not**
Aperiam's code, nothing here claims Aperiam runs a pacer, and the figures are fixed demo values.

## What it is based on

Aperiam's own description of itself, read on 2026-10-17 at <https://www.aperiam.vc/> and in text pasted by
the person who asked for this demo:

- "Aperiam is the leading adtech and martech venture capital firm."
- AperiamVentures: "Invests in and scales ad tech and mar tech startups."
- Aperiam Advisory: strategic consulting for brands, agencies and tech companies.
- Aperiam Ads: "Emerging tech orchestration for supply chain, commerce, and identity."
- Aperiam Marketing: corporate marketing for portfolio companies and partners.
- Services "for brands" include "adtech and martech stack design, digital transformation, and digital
  marketing optimization".

The site says nothing about AI, agents or multimodal data, and `aperiam.vc/aperiam-ads` returned 404 on the
same day. `amperium.ai`, named in this repository's README, does not resolve.

**Name and domain.** The person who asked for this demo says the firm is now at `amperiu.vc`. On 2026-10-17
neither `amperiu.vc` nor `amperium.vc` resolved from the machine that fetched the pages, so the quotes
above are from `aperiam.vc` and nothing here has been checked against the new address. The demo's code
does not depend on the name. Whether `amperiu.vc` and `aperiam.vc` are the same firm is the person's
identification, not something checked here.

## Verify the history

`sh history/replay.sh` builds a temporary repo from `history/0001` to `0005` and prints its path.
`test/history.test.mjs` checks that it reproduces exactly the files in this folder.
