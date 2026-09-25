# Authentication

## Why sessions instead of JWT

A JWT cannot be revoked before it expires without adding a blocklist or refresh-token machinery, which is a session store by another name. For a financial application, instant and unconditional revocation matters: logout, password change, account suspension. A server-side session gives that directly.

## Session design

| Item | Value |
|---|---|
| Token | 256 random bits from `crypto.randomBytes(32)`, hex encoded. Opaque, not derived from user data |
| What is stored | SHA-256 of the token, never the token |
| Redis | `session:<sha256>` holds `{userId, role, expiresAt, touchedAt}`; the fast path for every request |
| Postgres | `sessions` row keyed by the same hash: user, IP, user agent, created, last seen, expires, revoked |
| Idle timeout | 2 hours, sliding (`SESSION_IDLE_TTL_SECONDS`) |
| Absolute lifetime | 12 hours, fixed at creation (`SESSION_ABSOLUTE_TTL_SECONDS`) |

**Why hash the token.** The cookie carries the raw token; both stores hold only its hash. A read-only leak of Redis or the database therefore does not let an attacker hijack live sessions. This matches how OTP codes are treated.

**Why both stores.** Redis keeps per-request cost low. Postgres is the durable audit trail and the recovery source: if Redis is flushed or unreachable, `SessionService.validate` falls back to the database, checks revocation, expiry and idle time, and repopulates Redis. Users are not logged out by a cache restart.

**Sliding without write amplification.** Each request refreshes the Redis TTL. The database `last_seen_at` is written at most every 5 minutes.

**Revocation.** `revoke` deletes the Redis key and marks the row revoked. `revokeAllForUser` does this for every active session. Redis deletion errors are not swallowed: a logout that cannot remove the cached session fails loudly rather than pretending to succeed.

## Cookie

| Attribute | Value | Reason |
|---|---|---|
| `HttpOnly` | yes | Not readable from JavaScript |
| `Secure` | in production | HTTPS only |
| `SameSite` | `Strict` | Not sent on cross-site requests; primary CSRF defence |
| `Signed` | yes (`COOKIE_SECRET`) | Tamper evidence; forged values are rejected before any lookup |
| `Path` | `/` | Required by the `__Host-` prefix |
| Name | `__Host-sid` in production, `sid` otherwise | The prefix forbids a `Domain` attribute and forces `Secure`, blocking subdomain cookie injection |
| Expiry | Absolute session expiry | A ceiling; the server enforces idle timeout |

`SameSite=Strict` assumes the Flutter build and the API are same-site (same registrable domain) in production. A defence-in-depth `OriginCheckMiddleware` also rejects state-changing requests whose `Origin` header is neither in `CORS_ORIGINS` nor the API's own host.

## Flows

```
POST /auth/signup
  validates input, creates the user (role forced to `user`, unverified),
  emails a 6-digit code                                              -> 201 { userId }

POST /auth/verify-signup-otp   { userId, code }
  verifies the code, marks the email verified, creates a session
  and sets the cookie: the user is signed in                          -> 200 user

POST /auth/resend-otp          { userId }
  60-second cooldown, supersedes any earlier code                     -> 200 (generic)

POST /auth/forgot-password     { email }
  same 200 response whether or not the account exists, verified
  accounts get an emailed code                                        -> 200 (generic)

POST /auth/reset-password      { email, code, newPassword }
  verifies the code, updates the password, revokes every session
  for the account (this device included) — a fresh login is required  -> 200 (generic)

POST /auth/login               { email, password }
  see below                                                           -> 200 user

POST /auth/logout | /auth/logout-all | GET /auth/me                   (session required)
```

**Signed in means signed in.** Successful verification issues the session directly, so a new user is never asked to log in again. `login` is idempotent: if the request already carries a valid session for the same account, and the credentials are correct, no new session is created and the cookie is left alone. If it carries a session for a different account, that session is revoked before the new one is issued.

**Unverified accounts.** Correct password but unverified email returns `403 EMAIL_NOT_VERIFIED` with the `userId`, which is disclosed only after the password is proven. The client can route to the OTP screen and call `resend-otp`.

Sessions are also issued fresh on every login; there is no reuse of a pre-login identifier, so session fixation does not apply.

## OTP

| Property | Value |
|---|---|
| Scope | Signup verification, password reset |
| Generation | `crypto.randomInt(0, 1_000_000)`, zero-padded to 6 digits |
| Storage | `HMAC-SHA256(OTP_HMAC_SECRET, userId:purpose:code)` |
| Expiry | 10 minutes |
| Attempts | 5 per code, enforced with an atomic conditional `UPDATE` so concurrent guesses cannot exceed the cap |
| Resend | 60-second cooldown (Redis `SET NX EX`); a new code supersedes the old one |
| Comparison | `timingSafeEqual` |
| Single use | Consumption is a conditional update; a replay fails |
| Failure message | One generic message for wrong, expired, exhausted and unknown-user cases |

**Why HMAC rather than a plain hash.** A six-digit code has only one million possibilities. A plain SHA-256 of it can be reversed in milliseconds by anyone who reads the table. Keying the hash with a server secret, and binding it to the user and purpose, means a database leak alone does not reveal usable codes.

`resend-otp` sends only to the email address stored for that `userId`; the client never supplies a destination.

**Password reset** reuses the same OTP mechanism with a second purpose (`password_reset`), so it inherits the same expiry, attempt cap and cooldown, each tracked independently of a signup code for the same user. Unlike signup, `forgot-password` takes an email (not a `userId`) and returns an identical response whether or not the account exists or is verified, so the endpoint cannot be used to check which emails are registered. A successful reset revokes every session for the account rather than signing the user back in — anyone who had a device signed in (including the person who just reset the password) must sign in again with the new password. This is deliberately stricter than the signup flow: a password reset is the moment to assume the old credential, and any session created with it, may be compromised.

## Passwords

`argon2id` with `m=19 MiB, t=2, p=1` (the OWASP minimum recommendation), chosen over bcrypt for memory-hard resistance to GPU cracking. Policy: 10 to 128 characters with upper case, lower case and a digit. No truncation limit applies.

## Login hardening

| Control | Behaviour |
|---|---|
| Per-IP rate limit | 5 requests per minute on login, signup and verify, in Redis so it survives restarts and multiple instances |
| Per-account lockout | 5 failures within 15 minutes locks that email, keyed by a hash of the address, returns `429 ACCOUNT_LOCKED` with `Retry-After`; cleared on success |
| Timing equalisation | A password hash is verified against a dummy hash when the email is unknown, so response time does not reveal which emails exist |
| Uniform errors | Wrong password, unknown email and inactive account all return the same `401 INVALID_CREDENTIALS` |

## Trade-offs and limits

- **Lockout can be abused to lock someone out** for up to 15 minutes. Accepted: for a financial product, resisting distributed guessing outweighs it. The per-IP limit bounds how fast an attacker can trigger it.
- **Signup discloses whether an email or phone is registered** (`409 ACCOUNT_EXISTS`), without saying which. This is the standard usability trade-off; it is rate-limited.
- **Cached role.** The role is cached in the session for its lifetime. There is deliberately no role-change endpoint; any future one must call `revokeAllForUser` for the affected user.
- Password reset and MFA beyond email verification at signup are out of scope.
