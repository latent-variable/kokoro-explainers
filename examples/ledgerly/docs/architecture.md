# Architecture

Every request crosses four layers, each a trust boundary: a place where the system decides how
far to trust what came in.

```
internet -> [1] WAF -> [2] load balancer -> [3] API handlers -> [4] Postgres
```

1. **WAF** (`infra/waf-rules.yaml`): the edge firewall. Sees every request's method, path,
   headers and IP. Blocks known attack patterns (SQL injection, cross-site scripting) and rate
   limits by IP. It cannot see who a user is or what they own: it never reads the database.
2. **Load balancer** (`infra/nginx.conf`): ends TLS and spreads requests across API instances.
   Passes requests through unchanged; makes no access decisions.
3. **API handlers** (`api/`): `requireSession` (`api/middleware/auth.js`) checks the session
   token and sets `req.user` to `{ id, orgId, role }`. That is **authentication**: who you are.
   Each route must then check **authorization**: whether this user may touch this record.
4. **Postgres** (`db/schema.sql`): every invoice belongs to one organization (`org_id`). The API
   connects as one database role, `ledgerly_api`, which can read and write every row. Row-level
   security is available in Postgres but not enabled.

Invoice IDs are sequential integers (`serial`), so the next invoice's ID is easy to guess.
