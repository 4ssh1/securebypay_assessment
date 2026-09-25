# Architecture

## Stack

| Concern | Choice |
|---|---|
| Framework | NestJS 11 on Express |
| ORM | TypeORM 0.3, PostgreSQL (Neon) |
| Session cache and rate-limit store | Redis (`ioredis`, Upstash) |
| Mail | `nodemailer` behind a transport interface |
| Frontend | Flutter Web, separate repository |

The application is single-tenant. There is no tenant column, tenant resolution or per-tenant configuration anywhere; data access is scoped by role and ownership only.

## Module layout

```
AppModule
├── AppConfigModule   validated environment, typed getters (global)
├── RedisModule       one shared client (global)
├── DatabaseModule    TypeORM connection
├── AuthModule        signup, OTP, login, sessions, guards, decorators
├── ShipmentsModule   shipment queries, ownership policy, payment
├── WalletModule      balance, funding, atomic debit
├── DashboardModule   composes shipments and wallet into dashboard payloads
└── MailerModule      transports and templates
```

Dependencies point one way: `dashboard` depends on `shipments` and `wallet`, `shipments` depends on `wallet`, and nothing depends on `dashboard`.

## Separation of concerns

| Layer | Responsibility | Must not |
|---|---|---|
| Controller | Route, HTTP status, decorators, DTO in, DTO out | Contain business rules or queries |
| Service | Business rules, transactions | Read `req`/`res` or set cookies |
| Policy | Who may see or do what to which record | Perform side effects |
| Guard | Authenticate, authorize, throttle | Contain business logic |
| DTO | Input validation and normalisation | Reach the database |
| Entity | Persistence shape | Leak to clients directly |
| Filter / Interceptor | Cross-cutting: error format, envelope, logging | Know about any feature |

## Where shared logic lives (DRY)

| Concern | Single location |
|---|---|
| Role definitions and role groups | `common/enums/role.enum.ts`, `role-groups.ts` |
| Data scoping for shipments (list, KPIs, growth chart) | `ShipmentPolicy.applyScope` |
| Error shape and machine-readable codes | `AllExceptionsFilter`, `ErrorCode`, `AppException` |
| Response envelope and pagination | `ResponseEnvelopeInterceptor`, `Paginated` |
| Hashing, HMAC, constant-time compare | `common/utils/crypto.util.ts` |
| Money parsing | `common/utils/money.util.ts` |
| Input normalisation (email, phone, trim) | `common/dto/transforms.ts` |
| Cookie name, flags, set/clear/read | `SessionCookieService` |
| Redis key names | `redis/redis.constants.ts` |
| Client IP and user agent | `@ClientInfo()` |

## Request lifecycle

```
Request
  Express middleware (main.ts):   helmet, cookie-parser (signed), JSON body limit 10 kb, CORS
  Module middleware:              RequestIdMiddleware, OriginCheckMiddleware
  Guards (global, in order):      ThrottlerGuard, SessionGuard, RolesGuard, PolicyGuard
  Interceptors (inbound):         Logging, ClassSerializer, ResponseEnvelope
  Pipes:                          ValidationPipe (whitelist, forbid unknown, transform)
  Controller -> Service -> Repository -> PostgreSQL
  Interceptors (outbound):        ResponseEnvelope, ClassSerializer, Logging
  Any thrown error:               AllExceptionsFilter
```

Two consequences worth knowing:

- Guards run before pipes, so an unauthenticated request with an invalid body receives `401`, not `400`. No validation detail is disclosed to unauthenticated callers.
- The four guards are registered together in `app.module.ts`. Nest runs `APP_GUARD` providers in registration order, so keeping them in one place makes the order explicit and reviewable: session resolution always precedes role and policy checks.

## Response pipeline

Handlers return plain objects or DTOs. `ResponseEnvelopeInterceptor` wraps them as `{ success: true, data }`, and `Paginated` results as `{ success: true, data, meta }`. `ClassSerializerInterceptor` then applies `@Exclude()` as a backstop so `passwordHash` cannot leave the API even if an entity is returned by mistake. Errors are normalised by `AllExceptionsFilter`; unexpected errors return a generic message and log the stack server-side with the request ID.

## Configuration

`AppConfigService` is the only place that reads environment variables. Validation runs at boot and refuses to start on: missing or short secrets, wildcard CORS, the console mail transport in production, incomplete SMTP settings, or an absolute session lifetime shorter than the idle lifetime.

## Intentional scope limits

- Only the dashboard is implemented. Other sidebar pages are out of scope.
- Shipments are read and paid through the API; creating shipments is not exposed.
- `POST /wallet/fund` simulates a payment provider. See [security.md](security.md#known-gaps-and-production-hardening).
