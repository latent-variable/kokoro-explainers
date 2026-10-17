# Sources: invoice-leak

Source of record: `examples/ledgerly/` in this repo at commit c0d9dc8 (branch pitch-v2), read
2026-10-17. Ledgerly is a fictional code base; no customer is real. The brief (`brief.md`,
revised 2026-10-17: the firewall is no longer an option; A is now "switch the two routes off")
was checked against the code, not trusted alone.

## Claims

| Claim | Source |
|---|---|
| Overnight, user 88 of org 12 opened seven invoices (1041 to 1047) in order in 40 seconds, at about 02:14 UTC | [read] `logs/access-sample.log` lines 2 to 8, 02:14:09Z to 02:14:49Z. The log is UTC (`Z`); "overnight" is the brief's word, and the video shows "02:14 UTC", never a local time |
| Invoice 1041 was their own org's (12); the other six (1042 to 1047) belong to orgs 7, 31, 7, 19, 4, 31: **four** different companies | [read] same log, `invoice_org=`. The brief says six were other orgs'; four companies is counted from the log |
| The system returned every one (status 200) | [read] same log, every line `200` |
| It is an excerpt of one session; the video does not claim it is the only one | [read] `docs/threat-model.md` F-1 |
| Four layers a request crosses, each a trust boundary (a place the system decides how far to trust what came in): firewall (WAF), load balancer, API handlers, Postgres | [read] `docs/architecture.md` lines 3 to 8 |
| The firewall sees a request's method, path, headers and IP, never who owns a record; it cannot see who a user is or what they own | [read] `docs/architecture.md` item 1; `infra/waf-rules.yaml` line 1 |
| It cannot catch this: each request is a normal request from a signed-in user | [inferred] `docs/threat-model.md` F-1 (fourth bullet); the brief |
| The load balancer ends TLS and spreads requests, no access decisions; the API layer is where authentication and authorization live; the database holds every organization's invoices | [read] `infra/nginx.conf` line 1; `docs/architecture.md` items 2 to 4 |
| Authentication (who you are) works; authorization (may this user touch this record) is missing on two routes: `GET /invoices/:id` (open one invoice) and `PATCH /invoices/:id/status` (change its status) | [read] `api/routes/invoices.js` lines 14 to 23; `docs/architecture.md` item 3; `docs/threat-model.md` F-1 |
| The list route `GET /invoices` does filter by `org_id` (not shown in the video) | [read] `api/routes/invoices.js` lines 8 to 11 |
| What is exposed: an invoice row holds the customer's email, the amount and the status; any signed-in user can read another organization's and set its status | [read] `db/schema.sql` lines 3 to 9 (`customer_email`, `amount_cents`, `status`: open, paid, void); `api/routes/invoices.js` lines 14 to 23 |
| STRIDE is a threat checklist; F-1 is information disclosure (read), tampering (change status) and elevation of privilege. The video lists the three it names; the other three (spoofing, repudiation, denial of service) are not F-1 | [read] `docs/threat-model.md` lines 3 to 8 and 24 to 26 |
| The log shows reads only: no `PATCH` appears in it. The video never claims an invoice was changed | [read] `logs/access-sample.log`; the brief ("reads only so far") |
| Option A: make the two routes answer "temporarily unavailable" for everyone; live in minutes; the leak stops for certain; nobody can open a single invoice or change its status meanwhile; only those two by-ID routes go off, and the list route `GET /invoices` still works for each company (the card says so) | [read] `brief.md` (the agent's estimate for "minutes"); the routes are those in `api/routes/invoices.js` |
| Option B: add the caller's org (`and org_id = $2`) to the two by-ID queries; about an hour with tests and a deploy; customers lose nothing; the hole stays open for that hour; every future route must remember it | [read] `brief.md` (estimate). The pattern exists in the list route, `api/routes/invoices.js` line 10 |
| Option C: Postgres row-level security, so the database returns only the caller's org's rows whatever the code asks; days; every query and the connection setup change; a mistake can lock customers out of their own data; it would stop the next forgotten check from becoming a leak | [inferred] `brief.md` (estimate, risk, rationale). That RLS is available but off, and the API's one role can read every row: `db/schema.sql` lines 10 to 11; `docs/architecture.md` item 4 |
| Doing nothing: invoices stay readable, and changeable, by other customers' users, and it was already used overnight (the reads in the log) | [inferred] `docs/threat-model.md` F-1; `brief.md` |
| Recommendation: B tonight, then plan C; B closes this hole in about an hour and takes nothing from customers; C is too big and risky to rush tonight. It assumes an hour more exposure is acceptable given the log shows reads only; if not, switch the routes off (A) first while B is built | [inferred] `brief.md` "What I would pick" (the working agent's recommendation) |
| All durations (minutes, an hour, days) are the working agent's estimates; the video says so where they first appear and marks each "est." | [read] `brief.md` |

## Left out, and why

- OWASP API1 (Broken Object Level Authorization): a name the viewer does not need to decide.
- The `status` value in the PATCH is not validated (`req.body.status`, `api/routes/invoices.js` line 21): a second weakness, not part of this decision.
- Who user 88 is, or whether the access was malicious: the code does not say.
- Whether other sessions read invoices before this excerpt: the log is an excerpt.
- Spoofing, repudiation and denial of service rows of STRIDE: not what F-1 is.
- The WAF's managed rules and its 600 requests a minute limit, and sequential invoice IDs: true, but cut for time; the firewall is no longer an option.

## Terms and tags

- Tags: `[read]` was read from the named file at the pin; `[inferred]` is a conclusion drawn from what was read (a cause, a recommendation, what a fix would do).
- **company** is the video's word for an organization (`org_id`); the log chips say "CO. 7". **customers** means the people who would lose access. **options** (not "fixes") are A, B and C.
- **ownership check** (option B) is the check that the invoice belongs to the caller's company (`and org_id = $2`); the voice says "ownership check" once, then "option B".
- Option C's one gain is worded one way everywhere: "a forgotten check can't leak" (from the brief: it stops the next forgotten check becoming a leak).
- B's "about an hour, because the list route already filters by company" is the working agent's reason; the code supports the pattern (`api/routes/invoices.js` line 10, `[read]`); the hour itself is its estimate.
- "doing more than you are allowed" is STRIDE's elevation of privilege as `docs/threat-model.md` words it.
