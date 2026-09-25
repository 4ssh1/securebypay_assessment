# API reference

Interactive documentation is served at `/docs` outside production.

## Conventions

- JSON only. Request bodies over 10 KB are rejected.
- Authentication is the signed session cookie set by login or signup verification. There is no bearer token.
- Money is a decimal string (`"3000000.28"`). Timestamps are ISO 8601 UTC.
- Every response carries an `X-Request-Id` header, also present in error bodies.

### Success

```json
{ "success": true, "data": { } }
```

Paginated lists add `meta`:

```json
{ "success": true, "data": [ ], "meta": { "page": 1, "limit": 10, "total": 218, "totalPages": 22 } }
```

### Error

```json
{
  "success": false,
  "error": {
    "statusCode": 409,
    "code": "ACCOUNT_EXISTS",
    "message": "An account with this email or phone number already exists.",
    "details": null,
    "requestId": "0c9f...",
    "timestamp": "2026-09-24T10:00:00.000Z",
    "path": "/auth/signup"
  }
}
```

`details` holds the validation message list for `VALIDATION_FAILED`, `userId` for `EMAIL_NOT_VERIFIED`, and `retryAfterSeconds` for throttling and lockouts (also sent as a `Retry-After` header).

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

```json
{
  "period": "this_month",
  "range": { "from": "2026-09-01T00:00:00.000Z", "to": "2026-10-01T00:00:00.000Z" },
  "scope": "own",
  "sections": { "wallet": true, "growthChart": false, "recentShipments": true },
  "kpis": {
    "totalShipments": { "count": 34, "previousCount": 18, "changePercent": 88.9 },
    "totalExports":   { "count": 11, "previousCount": 6,  "changePercent": 83.3 },
    "totalImports":   { "count": 9,  "previousCount": 4,  "changePercent": 125 }
  },
  "wallet": { "balance": "3000000.28", "currency": "NGN" },
  "recentShipments": [ { "id": "...", "trackingId": "MAF-100-234-291", "...": "same shape as GET /shipments" } ]
}
```

`scope` is `own` for customers and `all` for staff and above. `wallet` is `null` when the role has no wallet. `recentShipments` is always the 3 most recent shipments visible to the caller — the same scoping rule as `GET /shipments`, so this cap applies to every role, not only customers. `changePercent` is `null` when the previous count is zero. The Total Shipment card counts every type, including domestic shipments, so it can exceed exports plus imports.

### `GET /dashboard/growth?granularity=year` (manager, admin)

`granularity`: `year` (12 monthly points for the current year), `month` (one point per day), `week` (Monday to Sunday). Buckets with no shipments are returned as zero so the chart never has gaps.

```json
{
  "granularity": "year",
  "scope": "all",
  "points": [ { "date": "2026-01-01", "shipments": 41, "revenue": "5231750.00" } ]
}
```

## Shipments

### `GET /shipments`

Query: `page` (default 1), `limit` (1 to 50, default 10), and optional `status`, `paymentStatus`, `type`. Newest first. Unknown query parameters are rejected.

```json
{
  "id": "b1ff2bee-...",
  "trackingId": "MAF-100-234-291",
  "sender": { "id": "...", "name": "Bunmi Tanny" },
  "receiver": { "name": "Mercy" },
  "route": { "pickUp": "Lagos, Nigeria", "delivery": "Oyo, Nigeria" },
  "amount": "3000.00",
  "currency": "NGN",
  "processingTimeHours": 10,
  "type": "domestic",
  "status": "in_transit",
  "paymentStatus": "paid",
  "createdAt": "2026-09-24T16:38:29.030Z"
}
```

### `POST /shipments` (user only)
Creates a shipment owned by the caller. Body:

```json
{
  "receiverName": "Mercy",
  "pickupLocation": "Lagos, Nigeria",
  "deliveryLocation": "Oyo, Nigeria",
  "type": "domestic",
  "amount": "3000.00",
  "processingTimeHours": 10
}
```

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

## Frontend integration notes (Flutter Web)

- Send requests with credentials (for Flutter web's `http` package use `BrowserClient()..withCredentials = true`; for Dio set `extra: {'withCredentials': true}`).
- The API origin must include the app's origin in `CORS_ORIGINS`; wildcards are refused.
- The cookie is `HttpOnly`. The client cannot read it and does not need to; treat any `401` as "signed out" and route to login.
- On `403 EMAIL_NOT_VERIFIED`, take `error.details.userId` to the OTP screen.
- Use `sections` from `GET /dashboard` to decide which widgets to render.
- Honour `Retry-After` and `details.retryAfterSeconds` on `429`.
