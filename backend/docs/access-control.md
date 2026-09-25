# Access control

Two layers answer two different questions. Both are enforced on the server; the client only uses `sections` from `GET /dashboard` to decide what to draw.

| Layer | Question | Mechanism |
|---|---|---|
| RBAC | Can this role reach this route at all? | `@Roles()` + `RolesGuard` |
| ABAC | Can this user act on this record, or see this slice of data? | `ShipmentPolicy`, `@CheckPolicy()` + `PolicyGuard` |

Authentication is the default: every route requires a valid session unless marked `@Public()`. A route without `@Roles()` is open to any authenticated role.

## Roles

`admin`, `manager`, `staff`, `user`, defined once in `common/enums/role.enum.ts`. Role groups used by both decorators and response logic live in `role-groups.ts`:

| Group | Roles | Used for |
|---|---|---|
| `WALLET_ROLES` | user | Wallet endpoints and the wallet card |
| `ANALYTICS_ROLES` | manager, admin | Company growth chart |
| `COMPANY_WIDE_ROLES` | staff, manager, admin | Unscoped shipment visibility |

Because `@Roles(...)` and the `sections` flags read the same groups, the API and the UI hints cannot drift apart.

## RBAC matrix

| Endpoint | user | staff | manager | admin |
|---|---|---|---|---|
| `POST /auth/signup`, `verify-signup-otp`, `resend-otp`, `login` | public | public | public | public |
| `GET /auth/me`, `POST /auth/logout`, `logout-all` | yes | yes | yes | yes |
| `GET /dashboard` | own data | all data | all data | all data |
| `GET /dashboard/growth` | 403 | 403 | all data | all data |
| `GET /wallet`, `POST /wallet/fund` | yes | 403 | 403 | 403 |
| `GET /shipments` | own | all | all | all |
| `POST /shipments` | yes | 403 | 403 | 403 |
| `GET /shipments/:id` | own only | any | any | any |
| `POST /shipments/:id/pay` | own only | 403 | 403 | 403 |

Staff, manager and admin are read-only over customer shipments; only the owning customer can spend their own wallet.

## ABAC rules

All shipment rules live in `ShipmentPolicy`:

| Rule | Implementation |
|---|---|
| `user` sees only shipments where they are the sender; staff and above see all | `scopeOf(user)` returns `own` or `all` |
| The same scope applies to lists, KPI counts, the growth chart and the 3-item recent-shipments feed on the dashboard | `applyScope(qb, alias, user)` adds `sender_id = :userId` for `own` |
| Reading one shipment | `canRead(user, shipment)` |
| Paying a shipment | `canPay(user, shipment)`: role is `user` and the user is the sender |
| Unknown role | `scopeOf` throws `403`; access is denied by default |

Because scoping is applied inside the query rather than filtered afterwards, a customer's aggregate numbers can never include another customer's rows.

## How resource-level checks are wired

`@CheckPolicy(SomeHandler)` attaches an injectable policy handler to a route. `PolicyGuard` resolves the handler through `ModuleRef`, so handlers get normal dependency injection, including repositories and services. That means database-backed checks belong at guard level too.

```
@CheckPolicy(ShipmentReadHandler)
@Get(':id')
findOne(@Resource() shipment: Shipment) { ... }
```

For `:id` routes the handler:

1. rejects a non-UUID `id`;
2. loads the shipment once, with the sender's name;
3. asks `ShipmentPolicy` whether this user may act on it;
4. stores the loaded entity on `req.resource`, which `@Resource()` hands to the controller, so the service never reloads it.

**Denied and missing look identical.** A shipment the caller may not access returns `404 NOT_FOUND`, the same as one that does not exist, so `403` never confirms that a record exists. Role failures from `RolesGuard` are `403`, because route existence is not secret.

## Adding a new rule

1. Put the decision in a method on the relevant policy class (pure function of user and record).
2. If it applies to a single record, add a small handler class that loads the record and calls it, register it as a provider, and reference it with `@CheckPolicy`.
3. If it applies to a collection, call `applyScope` on the query builder.
4. Add a unit test beside the policy; policies have no I/O so they test without a database.

## Non-goals

The application is not multi-tenant. There is no organisation, branch or tenant attribute in any policy, entity or query. Ownership (`sender_id`) and role are the only access attributes.
