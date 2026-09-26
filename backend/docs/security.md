# Security

## Controls

- Argon2id passwords, dummy-hash login checks, per-IP throttling and per-account lockout reduce credential attacks.
- HttpOnly signed cookies, `SameSite=Strict`, `Secure` production cookies, CORS and origin checks protect sessions and state-changing requests.
- Session tokens are stored only as SHA-256 hashes; logout and password reset revoke sessions.
- OTPs are HMAC-protected, expire after 10 minutes, allow five attempts and have resend cooldowns.
- Role guards and shipment policies prevent privilege escalation and cross-customer access. Inaccessible records return `404`.
- Parameterized queries, DTO whitelisting, UUID validation, a 10 KB body limit and generic error responses reduce injection and leakage.
- Wallet constraints, row locks and unique ledger references prevent overdrafts and duplicate payments.

## Mail and deployment

Resend is used for deployed OTP email. Console mail is development-only. Swagger is intentionally enabled for the production assessment deployment through `SWAGGER_ENABLED=true` and is available at `/docs`.

Nginx is not part of this application. A deployment may place a reverse proxy in front of Node for TLS, edge limits and forwarding client IPs; set `TRUST_PROXY_HOPS` to match that deployment.

## Remaining gaps

`POST /wallet/fund` simulates a payment provider. Production hardening may add signed provider webhooks, an audit event table, a secrets manager, backups, dependency/image scanning, and stronger MFA for privileged roles.