# Design decisions

- Server sessions are used instead of JWTs so logout, reset and suspension revoke access immediately.
- Session and OTP secrets are never stored as usable tokens or codes; session tokens are hashed and OTPs use keyed HMAC.
- Redis provides fast session, throttle and lockout lookups; PostgreSQL remains the durable source and audit store.
- OTP is required only for signup email verification and password reset. Normal login is email plus password.
- Signup verification signs the user in; password reset revokes sessions and requires a fresh login.
- Role and ownership scope are applied in queries, including dashboard aggregates.
- Customers own wallets and shipments; staff, managers and admins have read-only company shipment access. Managers and admins see growth analytics.
- Money remains decimal text at the API boundary and uses SQL-safe arithmetic.
- Migrations are used instead of `synchronize`; configuration is validated at startup.
- Resend is the deployed email provider. Swagger is available at `/docs` when `SWAGGER_ENABLED=true`.
- The app is single-tenant. Nginx is not included; a reverse proxy may be added by a deployment environment for TLS or edge rate limiting.