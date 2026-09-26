# Database

PostgreSQL 13+ is accessed through TypeORM with UUID keys, snake_case columns and migrations. `synchronize` is disabled.

## Relationships

`User` has sessions, OTP codes and shipments; a user may have one wallet. A wallet has many ledger transactions.

## Important tables

- `users`: identity, role, verification and Argon2id password hash.
- `sessions`: SHA-256 session token hash, expiry and revocation state.
- `otp_codes`: HMAC code hash, purpose, expiry, attempts and consumption state.
- `shipments`: sender, route, type, status, amount and payment status.
- `wallets` and `wallet_transactions`: NGN balance and idempotent funding/payment ledger.

Money is stored and returned as decimal strings. SQL uses integer minor units or numeric arithmetic; balances cannot go below zero. Shipment payment locks the shipment row and uses a unique ledger reference to prevent double payment.

## Migrations

```bash
pnpm migration:generate src/database/migrations/AddSomething
pnpm migration:run
pnpm migration:revert
```

## Seed data

The seed script creates five role-based users and customer shipment/wallet data, using the shared `SEED_PASSWORD`. It is disabled in production and exits when seed data already exists; it does not regenerate existing data.