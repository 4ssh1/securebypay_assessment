# Architecture

## Stack

NestJS 11/Express, TypeORM 0.3, PostgreSQL, Redis, Resend, and Flutter Web. The app is single-tenant; role and ownership control data access.

## Modules

`AppConfig` validates environment values. `Auth` handles signup, OTP, login and sessions. `Shipments` owns shipment queries and payments. `Wallet` owns balances and ledger entries. `Dashboard` composes shipment and wallet data. `Mailer` sends OTP templates through Resend.

## Request flow

Middleware applies Helmet, signed cookies, JSON limits and CORS. Global guards handle throttling, sessions, roles and resource policy. Pipes validate DTOs; controllers call services; TypeORM persists to PostgreSQL. Interceptors envelope responses and log requests; the exception filter normalizes errors.

## Boundaries

- Controllers handle HTTP concerns; services handle business rules.
- Policies enforce ownership and role scope inside database queries.
- DTOs validate input; entities are not returned directly.
- `AppConfigService` is the only environment access point.

## Configuration

Production uses Resend and may expose Swagger at `/docs` when `SWAGGER_ENABLED=true`. The Flutter origin is `https://www.snzeshi.tech` and must be in `CORS_ORIGINS`.

## Scope

The implemented workflow covers authentication, dashboard, shipments and wallet operations. Funding is a payment-provider simulation; real webhook integration remains future work.