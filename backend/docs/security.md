# Security

## Threat model

| Threat | Control | Where |
|---|---|---|
| Password guessing, credential stuffing | argon2id; per-IP throttle; per-account lockout; uniform errors; dummy-hash timing equalisation | `PasswordService`, `LoginAttemptsService`, `ThrottlerGuard` |
| Session theft through a database or Redis leak | Only SHA-256 of the token is stored | `SessionService` |
| Token theft through XSS | `HttpOnly` cookie, no token exposed to JavaScript, helmet headers | `SessionCookieService`, `main.ts` |
| CSRF | `SameSite=Strict`, CORS allow-list, JSON-only bodies, `Origin` check on state-changing requests | `SessionCookieService`, `OriginCheckMiddleware` |
| Cookie tampering or injection | Signed cookie; `__Host-` prefix in production | `SessionCookieService` |
| Session fixation | New random session per login; signed cookie cannot be planted | `AuthService.login` |
| Privilege escalation | Role forced to `user` at signup; unknown body fields rejected; no role-change endpoint; `RolesGuard` | `AuthService`, `ValidationPipe`, `RolesGuard` |
| IDOR on shipments | Ownership policy on every read and pay; denied looks like not found | `ShipmentPolicy`, `PolicyGuard` |
| Cross-customer data in aggregates | Scope applied inside the query for lists, KPIs and charts | `ShipmentPolicy.applyScope` |
| Double spend, lost updates, races | Row lock, conditional SQL debit, `CHECK (balance >= 0)`, unique ledger reference | `ShipmentsService.pay`, `WalletService` |
| Duplicate funding on retries or callbacks | Unique `reference`, replay returns the original result | `WalletService.fund` |
| OTP brute force | 6-digit code, 5 atomic attempts, 10-minute expiry, cooldown, per-route throttle | `OtpService` |
| OTP recovery from a database leak | Keyed HMAC bound to user and purpose | `OtpService` |
| Account enumeration | Uniform login errors, equalised timing, generic resend response. Signup conflict is disclosed by design | `AuthService` |
| SQL injection | Parameterised queries throughout; the only interpolated value in SQL is a `date_trunc` unit taken from a closed two-value union | `ShipmentsService.growthSeries` |
| Information leakage in errors | One filter; generic message and logged stack for unexpected errors; no `X-Powered-By` | `AllExceptionsFilter`, helmet |
| Sensitive data in logs | Logs contain method, path (no query string), status, duration, user ID, request ID. Never bodies, cookies or credentials | `LoggingInterceptor` |
| Oversized or malformed input | 10 KB body limit; whitelist validation; UUID and enum validation | `main.ts`, DTOs |
| Misconfiguration | Boot-time environment validation | `env.validation.ts` |
| Dev-only behaviour reaching production | Console mail transport and seeding refuse production; Swagger disabled in production | `env.validation.ts`, `seed.ts`, `main.ts` |

## Verification performed

Unit tests cover the policies, date and money arithmetic, hashing helpers and environment validation. Three end-to-end scripts (`scripts/smoke.sh`, `scripts/smoke-auth.sh`, `scripts/smoke-concurrency.sh`) run against a real Postgres and Redis and assert, among others:

- unauthenticated access, wrong roles and cross-customer access are refused with the documented status;
- five concurrent payments of one shipment debit exactly once;
- repeated and concurrent funding with one reference credits exactly once;
- the correct OTP is rejected after five wrong attempts, and cannot be replayed;
- the session survives a Redis flush, and a tampered cookie is rejected;
- `logout-all` invalidates other devices;
- account lockout engages after five failures;
- the cookie is `HttpOnly`, `SameSite=Strict` and signed; helmet headers and request IDs are present.

## Known gaps and production hardening

These are deliberate scope limits, listed so they are not mistaken for oversights.

| Gap | What production needs |
|---|---|
| `POST /wallet/fund` credits on request. It stands in for a payment provider | A provider integration where funding is credited from a signature-verified webhook. The idempotent reference and ledger are already in place for it |
| Audit trail is `sessions` plus structured logs | An append-only audit table for security-relevant events (login, payment, role or status change) |
| Email OTP at signup is the only second factor | TOTP or passkeys for admin and manager roles; password reset flow |
| Console mail transport in development | Real SMTP or a transactional provider (enforced in production by config validation) |
| Secrets come from environment variables | A secrets manager, rotation for `COOKIE_SECRET` and `OTP_HMAC_SECRET` |
| TLS, WAF and volumetric protection are infrastructure concerns | TLS termination at the proxy, plus the Nginx layer below |
| Dependency and image scanning | `pnpm audit` and automated updates in CI |
| Backups | Point-in-time recovery on Postgres |

### Reverse proxy layer

The in-app throttler protects specific routes. A proxy in front absorbs volumetric traffic before it reaches Node. The two are complementary: Nginx cannot tell a login attempt from any other POST, and the app cannot cheaply absorb a flood.

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

server {
  listen 443 ssl http2;
  location / {
    limit_req zone=api burst=40 nodelay;
    client_max_body_size 16k;
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Set `TRUST_PROXY_HOPS=1` when running behind one proxy so rate limits and session records use the real client IP rather than the proxy's.
