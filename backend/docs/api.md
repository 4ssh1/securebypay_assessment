# API reference

Interactive Swagger is served at `/docs` when `SWAGGER_ENABLED=true`, including the production assessment deployment.

## Conventions

- JSON bodies are limited to 10 KB and unknown fields are rejected.
- Authentication is an HttpOnly signed session cookie; there are no bearer tokens.
- Login uses email and password. OTP is limited to signup verification and password reset.
- Money is a decimal string, timestamps are ISO 8601 UTC, and responses include `X-Request-Id`.

Success responses use `{ success: true, data }`; paginated responses also include `meta`. Errors use `{ success: false, error }` with a status, code, message, request ID, timestamp and path. `details` may contain validation errors, `userId`, or `retryAfterSeconds`.

### Error codes

| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body or query failed validation, or amount outside limits |
| 400 | `OTP_INVALID` | Wrong, expired, used, exhausted code, or reset requested for an unknown/unverified email |
| 401 | `UNAUTHENTICATED` | No valid session |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 402 | `INSUFFICIENT_FUNDS` | Wallet balance too low |
| 403 | `FORBIDDEN` | Role not permitted |
| 403 | `EMAIL_NOT_VERIFIED` | Correct password, email unverified; `details.userId` |
| 403 | `ORIGIN_NOT_ALLOWED` | Disallowed `Origin` on a state-changing request |
| 404 | `NOT_FOUND` | Missing, or not visible to the caller |
| 409 | `ACCOUNT_EXISTS` | Email or phone already registered |
| 409 | `ALREADY_PAID` | Shipment already paid |
| 409 | `SHIPMENT_NOT_PAYABLE` | Shipment is cancelled |
| 409 | `DUPLICATE_REFERENCE` | Funding reference reused with a different amount |
| 429 | `TOO_MANY_REQUESTS` | Per-route rate limit |
| 429 | `ACCOUNT_LOCKED` | Too many failed sign-ins |
| 429 | `OTP_COOLDOWN` | Resend requested too soon |
| 503 | `MAIL_DELIVERY_FAILED` | Email could not be sent |
| 500 | `INTERNAL_ERROR` | Unexpected; details are only in server logs |

## Auth

| Method and path | Body | Result |
|---|---|---|
| `POST /auth/signup` | `firstName`, `lastName`, `email`, `phone`, `password` | `201` `{ userId }` |
| `POST /auth/verify-signup-otp` | `userId`, `code` | `200` user; sets session cookie |
| `POST /auth/resend-otp` | `userId` | `200` generic message |
| `POST /auth/forgot-password` | `email` | `200` generic message (same response whether or not the account exists) |
| `POST /auth/reset-password` | `email`, `code`, `newPassword` | `200`; revokes every session for the account |
| `POST /auth/login` | `email`, `password` | `200` user; sets session cookie |
| `POST /auth/logout` | none | `200`; clears cookie |
| `POST /auth/logout-all` | none | `200`; revokes every session |
| `GET /auth/me` | none | `200` user |

User object: `id`, `firstName`, `lastName`, `email`, `phone`, `role`, `isEmailVerified`.

## Dashboard

### `GET /dashboard?period=this_month`

`period`: `this_month` (default), `last_month`, `this_year`. Compared against the preceding equivalent period.

Returns KPIs, `scope`, role-based `sections`, up to three recent visible shipments, and a wallet for `user`. `scope` is `own` for customers and `all` for staff, managers and admins.

### `GET /dashboard/growth?granularity=year` (manager, admin)

`granularity`: `year` (12 monthly points for the current year), `month` (one point per day), `week` (Monday to Sunday). Buckets with no shipments are returned as zero so the chart never has gaps.

Returns `{ granularity, scope, points }`; empty time buckets are returned as zero.

## Shipments

### `GET /shipments`

Query: `page` (default 1), `limit` (1 to 50, default 10), and optional `status`, `paymentStatus`, `type`. Newest first. Unknown query parameters are rejected.

Returns shipment records with tracking ID, sender/receiver, route, amount, type, status, payment status and timestamps.

### `POST /shipments` (user only)
Creates a shipment owned by the caller. Body:

Body: `receiverName`, `pickupLocation`, `deliveryLocation`, `type`, `amount`, `processingTimeHours`. Tracking ID and initial statuses are generated server-side.

`type` is `export`, `import` or `domestic`. Returns `201` with the created shipment (same shape as a list item). `trackingId` is generated server-side (`MAF-###-###-###`); `status` starts `pending`, `paymentStatus` starts `unpaid`.

### `GET /shipments/:id`
One shipment (same shape). `404` if it does not exist or the caller may not see it.

### `POST /shipments/:id/pay` (user, owner only)
Pays from the wallet. Returns `{ shipment, walletBalance }`. Errors: `402`, `409 ALREADY_PAID`, `409 SHIPMENT_NOT_PAYABLE`.

## Wallet (user only)

### `GET /wallet`
`{ "balance": "3000000.28", "currency": "NGN" }`

### `POST /wallet/fund`
Body `{ "amount": "1000.50", "reference": "client-generated-key" }`. `amount` is between 100.00 and 5,000,000.00 with at most two decimals; `reference` is 8 to 64 characters of letters, digits, `-` or `_`. Generate the reference once per user action and reuse it on retries. Returns `{ balance, currency, reference, replayed }`.

## Flutter integration

Send requests with credentials, include `https://www.snzeshi.tech` in `CORS_ORIGINS`, treat `401` as signed out, route `EMAIL_NOT_VERIFIED` using `error.details.userId`, render widgets from `dashboard.sections`, and honor `Retry-After` on `429`.
