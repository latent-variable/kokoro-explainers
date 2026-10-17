# Sources: invoice-leak

Source of record: `examples/ledgerly/` in this repo at commit c0d9dc8 (branch pitch-v2), read
2026-10-17. Ledgerly is a fictional code base; no customer is real. The brief
(`brief.md`) was checked against the code, not trusted alone.

## Claims

| Claim | Source |
|---|---|
| Overnight, user 88 of org 12 opened seven invoices (1041 to 1047) in order in 40 seconds | `logs/access-sample.log`: lines 2 to 8, 02:14:09Z to 02:14:49Z (40 s) |
| Invoice 1041 was their own org's (12); the other six (1042 to 1047) belong to orgs 7, 31, 7, 19, 4, 31, which is **four** different companies | same log, `invoice_org=` field. The brief says six were other orgs' (true) but not how many companies; four is counted from the log |
| The system returned every one (status 200) | same log, every line `200` |
| It is an excerpt of one session; the video does not claim it is the only one | `docs/threat-model.md` F-1: "shows one session" |
| Four layers: WAF, load balancer, API handlers, Postgres | `docs/architecture.md` lines 3 to 8 |
| The WAF sees method, path, headers and IP, never the database or who owns a record | `docs/architecture.md` item 1; `infra/waf-rules.yaml` line 1 |
| The WAF has managed rules for SQL injection and cross-site scripting, a rate limit of 600 requests a minute per IP, and no custom rules | `infra/waf-rules.yaml` lines 3 to 9 |
| The load balancer ends TLS, spreads requests, and makes no access decisions | `infra/nginx.conf` line 1; `docs/architecture.md` item 2 |
| The API layer is where authentication (`requireSession`, who you are) and authorization (may you touch this record) live | `api/middleware/auth.js` lines 1 to 2; `docs/architecture.md` item 3 |
| The database holds every organization's invoices, each with an `org_id`; the API's one role can read and write every row; row-level security is not enabled | `db/schema.sql` lines 3 to 11; `docs/architecture.md` item 4 |
| `GET /invoices/:id` and `PATCH /invoices/:id/status` check the session, never that the invoice is the caller's org's | `api/routes/invoices.js` lines 14 to 23; `docs/threat-model.md` F-1 |
| `GET /invoices` (the list) does filter by `org_id` | `api/routes/invoices.js` lines 8 to 11 |
| Invoice IDs are sequential integers, so the next is easy to guess | `db/schema.sql` line 4; `docs/architecture.md` last line |
| STRIDE is a checklist of six threat kinds; F-1 is information disclosure (emails, amounts) plus tampering / elevation of privilege (status change) | `docs/threat-model.md` lines 3 to 8 and 24 to 26 |
| The log shows reads only: no `PATCH` appears in it | `logs/access-sample.log`. The brief says "Someone already did it overnight", meaning the reads; no status change is evidenced |
| Each request is well formed from a signed-in user, so the WAF cannot catch it; 7 requests in 40 s is far under 600 a minute | `docs/threat-model.md` F-1 (fourth bullet); `infra/waf-rules.yaml` line 6 |
| Option A: a WAF rule slowing or blocking one client reading many IDs; live in minutes, no code change; cannot know who owns an invoice; a slower or random walk gets through; the hole stays open | `brief.md` (the agent's estimate for "minutes"); the can't-know part from `docs/architecture.md` item 1 |
| Option B: add the caller's org to the two by-ID queries (`and org_id = $2`); about an hour with tests and deploy; every future route must remember | `brief.md` (the agent's estimate). The pattern already exists in the list route, `api/routes/invoices.js` line 10 |
| Option C: Postgres row-level security returns only the caller's org's rows whatever the code asks; days; every query and the connection setup change; a mistake can lock customers out | `brief.md` (the agent's estimate and risk). That RLS is available but off: `docs/architecture.md` item 4 |
| Doing nothing: every customer's invoices stay readable and changeable by every other customer's users | `docs/threat-model.md` F-1 |
| Recommendation: B now, A as a stopgap for the hour until B deploys, C planned next; reasons as the brief gives them | `brief.md` "What I would pick" (the working agent's recommendation) |
| All durations (minutes, an hour, days) are the working agent's estimates | `brief.md`; the video says so |

## Left out, and why

- OWASP API1 (Broken Object Level Authorization): a name a non-specialist does not need to decide; cut for time.
- The `status` value in the PATCH is not validated (`req.body.status`, `api/routes/invoices.js` line 21): a second weakness, not part of this decision.
- Who user 88 is, or whether the access was malicious: the code does not say.
- Whether other sessions read invoices before this excerpt: the log is an excerpt.
- Repudiation and denial of service rows of STRIDE: not what F-1 is.
