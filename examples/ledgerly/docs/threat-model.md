# Threat model

Method: STRIDE at each trust boundary. STRIDE names six kinds of threat: **S**poofing (pretending
to be someone), **T**ampering (changing data you should not), **R**epudiation (denying you did
something, with no record to prove it), **I**nformation disclosure (seeing what you should not),
**D**enial of service (making it unavailable), **E**levation of privilege (doing more than you
are allowed). Reviewed 2026-10-03.

| Boundary | S | T | R | I | D | E |
|---|---|---|---|---|---|---|
| internet -> WAF | TLS | managed rules | WAF logs | - | rate limit 600/min/IP | - |
| WAF -> load balancer | private network | - | - | - | health checks | - |
| load balancer -> API | session token (`requireSession`) | input validation | access log (user id, path) | **F-1** | - | **F-1** |
| API -> Postgres | one DB role | parameterised queries | - | **F-1** | connection pool | **F-1** |

## Open finding F-1: invoices are not scoped to the caller's organization (found 2026-10-17)

`GET /invoices/:id` and `PATCH /invoices/:id/status` (`api/routes/invoices.js`) check that the
caller is logged in, never that the invoice belongs to the caller's organization. Any logged-in
user of any customer can read any invoice, and mark any invoice paid or void, by changing the
number in the URL. The list route, `GET /invoices`, does filter by `org_id`; the two routes by
ID do not.

- STRIDE: **Information disclosure** (read another organization's invoices: customer emails,
  amounts) and **Elevation of privilege** / **Tampering** (change their status).
- OWASP API Security Top 10 (2023): API1, Broken Object Level Authorization.
- Authentication works; authorization is missing. The WAF cannot catch it: each request is a
  well-formed request from a logged-in user.
- `logs/access-sample.log` shows one session, user 88 of org 12, reading invoices 1041 to
  1047 in order within 40 seconds, six of which belong to other organizations.
