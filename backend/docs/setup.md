# Setup

## Prerequisites

- Node.js 20 or later, pnpm
- PostgreSQL 13 or later (Neon works)
- Redis (Upstash works)
- For sending real OTP email: SMTP credentials. Not needed in development, where codes are printed to the server log

## Install

```bash
pnpm install
```

If pnpm reports ignored build scripts for `argon2`, run `pnpm approve-builds` and allow it. Prebuilt binaries are used for common platforms.

## Environment

```bash
cp .env.example .env
```

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string. Use the direct (non-pooled) URL for migrations |
| `DATABASE_SSL` | `true` for Neon and most hosted Postgres, `false` for local |
| `REDIS_URL` | `redis://` locally; `rediss://` (TLS) for Upstash |
| `COOKIE_SECRET` | 32 or more random characters, signs the session cookie |
| `OTP_HMAC_SECRET` | 32 or more random characters, different from the cookie secret |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. Wildcards are refused |
| `TRUST_PROXY_HOPS` | Number of reverse proxies in front (0 for none) |
| `SESSION_IDLE_TTL_SECONDS` | Default 7200 |
| `SESSION_ABSOLUTE_TTL_SECONDS` | Default 43200 |
| `MAIL_TRANSPORT` | `console` (development) or `smtp` (required in production) |
| `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Required when `MAIL_TRANSPORT=smtp` |
| `SEED_PASSWORD` | 12 or more characters; password for all seeded accounts |

Generate secrets with `openssl rand -hex 32`.

The application refuses to start if a required value is missing or invalid, and the error names the variable.

### Getting OTP email working

`MailerService` only needs a transport, so any of these work:

1. **Console (default in development).** The code is printed in the server log. Nothing to set up; suitable for demonstrating the flow.
2. **Local SMTP catcher** such as Mailpit: set `MAIL_TRANSPORT=smtp`, `SMTP_HOST=localhost`, `SMTP_PORT=1025`, and any user and password. Codes appear in its web inbox.
3. **Transactional provider** (Resend, Mailgun and similar free tiers) or a business mailbox: set the SMTP values they give you. Personal free mailboxes are unreliable for programmatic sending.

## Run

```bash
pnpm migration:run
pnpm seed
pnpm start:dev
```

Production:

```bash
pnpm build
NODE_ENV=production pnpm migration:run
pnpm start:prod
```

Production requires `MAIL_TRANSPORT=smtp`, a non-wildcard `CORS_ORIGINS` over HTTPS, and both secrets. Swagger and seeding are disabled.

## Test

```bash
pnpm test                     # unit tests
pnpm start:dev                # in one terminal
bash scripts/smoke.sh         # end-to-end, needs seeded data
bash scripts/smoke-auth.sh    # end-to-end auth checks; reads OTP codes from /tmp/api.log
bash scripts/smoke-concurrency.sh   # concurrent payment and funding are applied exactly once
```

`smoke.sh` waits about a minute mid-run so the per-route login rate limit window resets. `smoke-auth.sh` expects the server log at `API_LOG` (default `/tmp/api.log`) and uses `redis-cli`; run the server with `pnpm start:dev > /tmp/api.log 2>&1` for it.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Boot error naming a variable | Environment validation; fix that variable |
| `429` during manual testing | Per-route rate limit; wait a minute, or clear Redis in development |
| `ACCOUNT_LOCKED` | Five failed sign-ins; wait 15 minutes or delete the `auth:fail:*` key in Redis |
| Cookie not sent from the browser | Frontend and API must be same-site, the request must include credentials, and the origin must be in `CORS_ORIGINS` |
| `Secure` cookie ignored | Only in production mode; use HTTPS there |
