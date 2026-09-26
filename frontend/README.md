# SecureByPay — Frontend

A Flutter Web client for the SecureByPay shipment-tracking and wallet dashboard, with a role-aware UI (customer, staff, manager, admin) driven entirely by what the API returns.

---

## 1. Tech Stack

![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white)
![Riverpod](https://img.shields.io/badge/Riverpod-2A62E9?style=for-the-badge)
![go_router](https://img.shields.io/badge/go__router-02569B?style=for-the-badge)
![Google Fonts](https://img.shields.io/badge/Google_Fonts-4285F4?style=for-the-badge&logo=googlefonts&logoColor=white)

| Package | Role |
|---|---|
| **Flutter Web** | Cross-platform UI framework, compiled to run in the browser |
| **flutter_hooks** | Local component state (`useState`, `useMemoized`, `useTextEditingController`) without boilerplate `StatefulWidget`s |
| **hooks_riverpod** | Global/async state — API-backed providers (`FutureProvider.family`) for dashboard and growth data, auth state |
| **go_router** | Declarative routing, deep-linkable paths (e.g. OTP verification by user id), navigation guards |
| **google_fonts** (DM Sans) | Typography, loaded on demand rather than bundled |
| **flutter_svg** | Vector asset rendering for icons/illustrations |
| **fl_chart** | The Company Growth line chart (manager/admin dashboard) |

---

## 2. UI/UX Decisions

- **Role-driven rendering, not role-checking.** Widgets like the wallet card, growth chart, and "Pay Now" button are shown or hidden based on the `sections` object returned by `GET /dashboard` (`sections.wallet`, `sections.growthChart`, etc.), not a hard-coded `if (role == 'user')`. If the backend changes what a role can see, the frontend adapts automatically.

- **Responsive layout system.** A shared `Responsive` helper switches between:
  - A permanent sidebar (desktop) vs. an `AppBar` + `Drawer` (mobile).
  - Larger content padding and multi-column metric rows on desktop; stacked, full-width cards on mobile.
  - Fluid font sizing (e.g. the wallet balance) via `Responsive.font(context, min:, max:)` instead of fixed sizes.

- **Correct-aspect-ratio media.** Banner/promo images are wrapped in `AspectRatio` using their real source dimensions (not a guessed ratio), so `BoxFit.cover` scales cleanly without cropping off parts of the artwork on different screen widths.

- **Reachable demo access on mobile.** The "Try a demo account" bottom sheet uses `isScrollControlled: true` with a capped `maxHeight` (75% of screen height) and a rounded top edge, so it opens anchored higher on the screen instead of stretching edge-to-edge and being awkward to reach one-handed on small phones.

- **Explicit state for every async action.** Login, wallet funding, and dashboard loading each have distinct loading / error / success UI:
  - Inline error banners (not silent failures or raw exception text).
  - Buttons disable and show a spinner while a request is in flight, preventing double-submits.
  - Snackbars confirm side effects (e.g. "Wallet funded successfully").

- **Idempotent-safe funding UI.** The Fund Wallet dialog generates a client-side reference when it opens and reuses the *same* reference on retry after a network failure, so resubmitting a failed request can't double-charge the wallet — the UI cooperates with the backend's idempotency contract instead of fighting it.

- **Generic-but-actionable error messaging.** Auth errors distinguish what the user can act on (e.g. an account-lock countdown, "resend code") without leaking information the backend intentionally withholds (e.g. login never reveals whether the email or the password was wrong).

---

## 3. Project Structure

```
lib/
  core/
    api/               # HTTP client, exception mapping, provider wiring
    models/             # DashboardOverview, Shipment, Wallet, etc.
    theme.dart           # Colors, text theme
    responsive.dart      # Breakpoint + font-scaling helpers
    app_routes.dart      # Route name constants
    validators/           # Form validation rules

  features/
    auth/
      sign_in_page.dart
      auth_providers.dart
    dashboard/
      dashboard_page.dart
      dashboard_providers.dart
      widgets/
        metric_card.dart
        wallet_card.dart
        growth_chart.dart
        recent_shipment_card.dart
        fund_wallet_dialog.dart

  shared/
    widgets/             # AppSidebar, SplitLayout, CustomTextField, ErrorBanner
    hooks/                # useSessionStorage and other reusable hooks
```

---

## 4. Running Locally

```bash
flutter run -d chrome 
```
