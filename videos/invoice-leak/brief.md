# Brief: how do we close the invoice leak?

From: the coding agent working on Ledgerly's export feature, 2026-10-17.
For: the engineering lead, who owns the call and is not a security specialist.
Code: `examples/ledgerly/` in this repo, at this branch. Read it; this brief can be wrong.

## The decision

Any logged-in user can read, and change the status of, any other company's invoice by
changing the number in the URL. Someone already did it overnight. Which fix do we ship now?

## What I found

While adding the export, I read `api/routes/invoices.js`. The two routes by ID check that the
caller is logged in, never that the invoice is their organization's (finding F-1 in
`docs/threat-model.md`). The access log excerpt shows user 88 of org 12 reading invoices 1041
to 1047 in order in 40 seconds; six were other organizations'.

## The options I see

- **A. A WAF rule.** Block or slow one client reading many invoice IDs in a row. Live in
  minutes, no code change. But the WAF cannot know who owns an invoice: a slower or random walk
  gets through, and the hole stays open.
- **B. An ownership check in the handlers.** Add `and org_id = $2` (the caller's org) to the
  two queries by ID. Closes the hole where it is. About an hour with tests and a deploy. Every
  future route must remember to do the same.
- **C. Row-level security in Postgres.** Make the database itself return only the caller's
  organization's rows, whatever the code asks. Catches the next route that forgets, too. Days:
  every query and the connection setup change, and a mistake can lock customers out of their
  own data.
- **Doing nothing:** every customer's invoices stay readable, and changeable, by every other
  customer's users, and it is already being used.

## What I would pick

B now, with A as a stopgap for the hour until B deploys, and C planned next. B is the real fix
for this hole and is small; A only buys time; C is the layer that keeps the next forgotten
check from becoming the next leak, but it is too big and risky to rush tonight.

## For the video

The lead is not a security person. They need to see the four layers a request crosses and
which layer each fix lives in, why the WAF cannot see this bug, what authentication versus
authorization means here, and which STRIDE threats this is. Then the three options side by
side, what each gains and costs, and the recommendation.
