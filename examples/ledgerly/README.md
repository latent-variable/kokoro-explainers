# Ledgerly (fictional)

A made-up invoicing API, small enough to read in five minutes, that exists so ShipShow has a
code base to make its demo decision video about (`videos/invoice-leak`). Nothing here runs in
production and no customer is real. It carries one deliberate security bug, described in
`docs/threat-model.md` as finding F-1.

| Path | What |
|---|---|
| `docs/architecture.md` | How a request travels: WAF, load balancer, API, database |
| `docs/threat-model.md` | The trust boundaries, STRIDE at each, and the open finding |
| `infra/waf-rules.yaml` | The edge firewall's rules |
| `infra/nginx.conf` | The load balancer |
| `api/middleware/auth.js` | Who you are (authentication) |
| `api/routes/invoices.js` | The invoice endpoints |
| `db/schema.sql` | The tables |
| `logs/access-sample.log` | An excerpt of the API's access log |
