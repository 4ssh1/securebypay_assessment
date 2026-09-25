# SecureByPay API

Backend for the SecureByPay logistics dashboard. NestJS, TypeORM (Postgres), Redis, session-based authentication, RBAC + ABAC. Single-tenant. The Flutter Web client consumes this API and is built separately.

## Quick start

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL, REDIS_URL and both secrets
pnpm migration:run
pnpm seed                     # mock users and shipments (never runs in production)
pnpm start:dev
```

Interactive API docs (non-production only): `http://localhost:3000/docs`

Full setup details: [docs/setup.md](docs/setup.md)

## Seeded accounts

All use the password from `SEED_PASSWORD`.

| Email | Role | Sees |
|---|---|---|
| user@securebypay.test | user | Own shipments, KPIs and wallet |
| user2@securebypay.test | user | Own shipments, KPIs and wallet |
| staff@securebypay.test | staff | All shipments (read-only), KPIs |
| manager@securebypay.test | manager | Staff view plus company growth chart |
| admin@securebypay.test | admin | Everything |

## Dashboard screen to endpoint map

| UI section | Endpoint |
|---|---|
| Wallet card, Fund Wallet | `GET /wallet`, `POST /wallet/fund` |
| KPI cards and timeframe selector | `GET /dashboard?period=this_month` |
| Company Growth chart, Year / Month / Week | `GET /dashboard/growth?granularity=year` (manager, admin) |
| Recent shipment list, View More, Pay Now | `GET /shipments`, `GET /shipments/:id`, `POST /shipments/:id/pay` |
| Sidebar profile, Logout | `GET /auth/me`, `POST /auth/logout` |
| Invite & Earn header and banner | Static frontend content |

`GET /dashboard` returns a `sections` object telling the client which widgets the signed-in role should render.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm start:dev` | Watch mode |
| `pnpm build` / `pnpm start:prod` | Production build and run |
| `pnpm migration:generate src/database/migrations/<Name>` | Generate a migration from entity changes |
| `pnpm migration:run` / `pnpm migration:revert` | Apply or roll back migrations |
| `pnpm seed` | Load mock data |
| `pnpm test` | Unit tests |
| `bash scripts/smoke.sh`, `smoke-auth.sh`, `smoke-concurrency.sh` | End-to-end checks against a running API |

## Documentation

| Document | Covers |
|---|---|
| [architecture.md](docs/architecture.md) | Modules, request lifecycle, separation of concerns |
| [authentication.md](docs/authentication.md) | Sessions, cookies, OTP, passwords, lockout |
| [access-control.md](docs/access-control.md) | RBAC matrix, ABAC policies, how to add a rule |
| [database.md](docs/database.md) | Schema, indexes, money handling, migrations |
| [api.md](docs/api.md) | Response format, error codes, endpoints |
| [security.md](docs/security.md) | Threat model, controls, production hardening |
| [decisions.md](docs/decisions.md) | Design decisions and trade-offs |
| [setup.md](docs/setup.md) | Environment, services, running and testing |
