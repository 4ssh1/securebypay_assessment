# SecureByPay — Shipment & Wallet Dashboard

A shipment-tracking and wallet management platform with a role-based dashboard (customer, staff, manager, admin), built as a NestJS API with a Flutter Web frontend.

---

## 1. Tech Stack

### Backend

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-FF4438?style=for-the-badge&logo=redis&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)
![JWT](https://img.shields.io/badge/Cookie_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

| Technology | Role |
|---|---|
| **NestJS** | Modular architecture with dependency injection |
| **TypeORM** | Database access and migrations |
| **PostgreSQL** | Primary datastore |
| **Redis** | Session store |
| **class-validator / class-transformer** | Request DTO validation and environment variable validation |
| **Helmet** | HTTP security headers and Content Security Policy |
| **cookie-parser** | Signed, `HttpOnly` session cookies |
| **Swagger (OpenAPI)** | Interactive API docs at `https://api.snzeshi.tech/docs` |
| **Resend** | Transactional email in production; console transport for local development |

### Frontend

![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white)
![Riverpod](https://img.shields.io/badge/Riverpod-2A62E9?style=for-the-badge)
![go_router](https://img.shields.io/badge/go__router-02569B?style=for-the-badge)
![Google Fonts](https://img.shields.io/badge/Google_Fonts-4285F4?style=for-the-badge&logo=googlefonts&logoColor=white)

| Technology | Role |
|---|---|
| **Flutter Web** | Cross-platform UI framework |
| **flutter_hooks / hooks_riverpod** | State management and lifecycle hooks |
| **go_router** | Declarative routing and navigation guards |
| **google_fonts** (DM Sans) | Typography |
| **flutter_svg** | Vector asset rendering |
| **fl_chart** | The Company Growth line chart |

---

## 2. UI/UX Decisions

- **Role-aware dashboard** — widgets (wallet card, growth chart, recent shipments) are shown or hidden based on the `sections` flags returned by the API, rather than hard-coded role checks on the client. This keeps the frontend in sync with backend permissions by construction.
- **Responsive layout** — a shared `Responsive` helper switches between a permanent sidebar (desktop) and a drawer + app bar (mobile), and adjusts content padding, font sizing, and card stacking (row vs. column) per breakpoint.
- **Correct-aspect-ratio media** — banner and promotional images are wrapped in `AspectRatio` using their real source dimensions, so `BoxFit.cover` scales without unexpectedly cropping the artwork on different screen widths.
- **Accessible demo access** — a "Try a demo account" entry point on sign-in opens a bottom sheet capped at a fixed height (`isScrollControlled` + `maxHeight` constraint) and anchored higher on the screen, so it stays reachable and readable on small phones instead of stretching edge-to-edge.
- **Consistent feedback states** — every async action (login, funding a wallet, loading dashboard data) has explicit loading, error, and success states (inline error banners, disabled buttons with spinners, snackbars) rather than silent failures.
- **Idempotent-safe UI for money movement** — the Fund Wallet dialog generates a client-side reference up front and reuses it on retry, so a flaky network request can safely be resubmitted without the risk of a double charge appearing to the user.

---

## 3. Security Measures

### Authentication & Sessions
- Session-based auth via a signed, `HttpOnly` cookie — no tokens are stored or handled by the client.
- Cookie name is `__Host-sid` in production (enforces `Secure`, `Path=/`, no `Domain` attribute) and a plain `sid` in development.
- Configurable idle (default 2h) and absolute (default 12h) session TTLs, with a validation rule ensuring the absolute TTL can never be shorter than the idle TTL.
- Failed logins are rate-limited per email (5 attempts locks the account temporarily) to slow down credential-stuffing attempts.

### Transport & Headers
- **Helmet** applies a strict default CSP; Swagger's specific inline-script/style and image requirements are the only explicit exceptions.
- **CORS** is locked to an explicit, comma-separated allow-list (`CORS_ORIGINS`) — wildcard origins (`*`) are rejected at startup by environment validation, not just at runtime.
- `trust proxy` is explicitly configurable (`TRUST_PROXY_HOPS`) so `X-Forwarded-*` headers are only trusted for the real number of upstream proxies, preventing IP/protocol spoofing.

### Input Handling
- Global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` — any field not explicitly defined on a DTO is stripped or rejected, closing off mass-assignment style attacks.
- Request body size is capped (10 KB) to reduce denial-of-service risk from oversized payloads.
- All environment variables are validated at boot (`class-validator`) with fail-fast errors — the app refuses to start with a short secret, a wildcard CORS origin, or an unsafe mail transport in production, rather than running in a misconfigured state.

### Account & Data Protection
- Passwords require a minimum length and character mix, hashed before storage (never logged or returned in API responses).
- Email verification and password reset both use short-lived, single-use OTP codes with attempt limits and resend cooldowns.
- Password-reset and "forgot password" responses are intentionally identical whether or not the email exists, preventing user enumeration.
- Wallet funding requires a unique idempotency reference; replaying the same reference returns the original result instead of crediting twice, and reusing a reference with a different amount is rejected outright.
- Role-based access control (`user`, `staff`, `manager`, `admin`) is enforced server-side on every endpoint via decorators/guards — the frontend's conditional rendering is a UX convenience, not a security boundary.

---

## 4. Project Structure (high level)

```
backend/
  src/
    auth/            # login, signup, OTP, session/guards
    dashboard/        # KPIs, growth chart, role-scoped overview
    shipments/         # CRUD + payment
    wallet/            # balance + funding
    config/            # env validation + typed config service
    database/          # seed scripts, TypeORM setup

frontend/
  lib/
    features/
      auth/            # sign-in, sign-up, OTP screens
      dashboard/        # dashboard page + widgets (cards, chart, wallet)
    core/                # theming, responsive helpers, API client, models
    shared/              # reusable widgets (text fields, layouts)
```

---

## 5. Running Locally

Backend:
```bash
npm install
npm run start:dev
```

Frontend:
```bash
flutter run -d chrome --web-port 8080
```

See the API guide for full endpoint documentation, required environment variables, and seeded test accounts.