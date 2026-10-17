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

- **A. Switch the two routes off now.** Make `GET /invoices/:id` and
  `PATCH /invoices/:id/status` answer "temporarily unavailable" for everyone until a fix ships.
  Live in minutes, and the leak stops for certain. But no customer can open a single invoice or
  change its status in the meantime; the invoice list still works.
- **B. Add the ownership check to the two routes.** Add `and org_id = $2` (the caller's
  organization) to the two queries by ID. Closes the hole where it is, about an hour with tests
  and a deploy, and customers lose nothing. But the check lives in each route, so every future
  route must remember it, and the hole stays open for the hour it takes.
- **C. Row-level security in Postgres.** Make the database itself return only the caller's
  organization's rows, whatever the code asks. Catches the next route that forgets, too. Days:
  every query and the connection setup change, and a mistake can lock customers out of their
  own data.
- **Doing nothing:** every customer's invoices stay readable, and changeable, by every other
  customer's users, and it was already used overnight.

The firewall is not an option: it sees each request's address and path, not whose invoice it
is, and every one of these requests is a normal request from a signed-in user. Say so where the
layers are explained, because it is the first fix a viewer will think of.

## What I would pick

B tonight, then plan C. B closes this hole in about an hour and takes nothing away from
customers; C is the layer that stops the next forgotten check from becoming the next leak, but
it is too big and risky to rush tonight. This assumes an hour more exposure is acceptable,
given the log shows reads only so far. If it is not, switch the routes off first (A) while B is
built. The times are my estimates.

## For the video

The audience is technical but not in security: engineers, leads, founders. Open on the
decision, as a coding agent asking for their call. Explain the concepts in plain words the
first time they appear: the four layers a request crosses and that each is a trust boundary,
authentication (who you are) versus authorization (what you may touch), and what row-level
security does. Name the two routes. Say what is exposed in plain words: other companies'
customer emails and amounts, and their invoices' status. Keep STRIDE as one line tied to those
stakes. Then the three options side by side, what each gains and costs, doing nothing, and the
recommendation with its reason. A viewer should be able to say, after one watch, what is being
decided, what each option costs, and why B.
