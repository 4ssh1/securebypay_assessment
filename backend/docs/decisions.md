# Design decisions

| # | Decision | Reason | Alternative considered |
|---|---|---|---|
| 1 | Server-side sessions, not JWT | Instant, unconditional revocation | JWT with blocklist and refresh tokens: more moving parts, same outcome |
| 2 | Store the SHA-256 of the session token | A store leak does not yield live sessions | Raw token as key: simpler, but the leak becomes account takeover |
| 3 | Redis fast path with Postgres fallback and audit | Speed, plus resilience and history | Redis only: no audit; Postgres only: a query per request |
| 4 | Idle timeout plus absolute lifetime | A stolen but active session still ends | Sliding only: a session could live forever |
| 5 | OTP stored as keyed HMAC | Six digits are trivially brute-forced from a plain hash | Plain SHA-256: reversible in milliseconds |
| 6 | OTP attempts counted with an atomic conditional update | Concurrent guesses cannot exceed the cap | Read, check, write: racy |
| 7 | OTP for signup only | Scope decision. Password reset is not part of this build | |
| 8 | Signup verification issues the session | The user is not asked to sign in again | Redirect to login: extra step |
| 8a | Password reset does NOT issue a session; it revokes every session instead | A reset is the moment to assume prior sessions may be compromised; the user proves the new password by logging in with it | Auto-login after reset, matching signup |
| 8b | Password reset identifies the account by email, not `userId`, and always returns the same response | Unlike signup (where the client already knows it just created the account), a reset request must not confirm which emails are registered |
| 9 | Guards registered together in `AppModule` | Order is explicit and reviewable | Per-module registration: order depends on import order |
| 10 | Resource policies are injectable handlers resolved by `ModuleRef` | Database-backed checks at guard level with normal DI; one place per rule | Inline checks in services: repeated, easy to forget |
| 11 | Denied access to a record returns 404 | Does not confirm that a record exists | 403: leaks existence |
| 12 | Scope applied inside queries | Aggregates cannot include other customers' rows | Post-filtering results |
| 13 | Growth chart limited to manager and admin | It is labelled "Company Growth"; customers see their own KPIs | Show customers a personal chart |
| 14 | Wallet only for the `user` role | Staff, manager and admin do not hold customer funds | Company wallet: not in the design |
| 15 | Money as strings and SQL-side arithmetic | No float rounding, no read-modify-write races | JS numbers, or a decimal library in application code |
| 16 | `CHECK (balance >= 0)` plus conditional debit | Database enforces the invariant even if code is wrong | Application check only |
| 17 | Row lock on shipment payment | Serialises concurrent payments of one shipment | Optimistic version column |
| 18 | Migrations, `synchronize` off everywhere | Schema changes are reviewed and reversible; `synchronize` can drop columns and would run in production if `NODE_ENV` were unset | `synchronize` in development |
| 19 | Rate limits stored in Redis | Survive restarts and hold across instances | In-memory counters |
| 20 | Per-account lockout in addition to per-IP limits | Distributed guessing spreads across IPs | Per-IP only |
| 21 | Uniform response envelope and error filter | One shape for the client; no accidental stack traces | Ad hoc responses |
| 22 | `Origin` check on state-changing requests | Defence in depth beside `SameSite=Strict` | Rely on `SameSite` alone |
| 23 | Configuration validated at boot | Misconfiguration fails at deploy, not at first request | Read `process.env` where needed |
| 24 | Seeded mock data instead of hard-coded responses | Role and ownership rules can be seen working on real queries | Static JSON |
| 25 | `strict` TypeScript, relative imports, one DTO per file | Fewer runtime surprises; simple tooling | Path aliases |
| 26 | Nest 11, TypeORM 0.3, TypeScript 5 | Mature, widely documented lines | Newest majors: less field experience |
| 27 | Not multi-tenant | Requirement | Tenant column and scoping: absent by design |
| 27a | Recent-shipments feed embedded in `GET /dashboard`, capped at 3, same ownership scope as everything else | One round trip for the dashboard; the cap is enforced server-side for every role, including staff/manager/admin, not left to the frontend to self-limit | A separate `GET /shipments?limit=3` call left to client discipline |
| 27b | Shipment creation limited to the `user` role | Only customers ship packages in this design; staff/manager/admin remain read-only over shipments, consistent with the rest of the RBAC matrix | Allow staff to create on a customer's behalf: not requested |
| 28 | UTC calendar boundaries for periods and charts | Deterministic and testable | Business timezone: a contained change if needed |

## Behaviour that differs from the design mock-up

- The Total Shipment, Total Exports and Total Import cards in the picture all show 34. With real data, Total Shipment counts every type, so exports and imports are subsets of it. The seed gives the demo customer 34 shipments this month against 18 last month.
- Company Growth is computed from shipment counts (and revenue per bucket), not from the mock curve.
