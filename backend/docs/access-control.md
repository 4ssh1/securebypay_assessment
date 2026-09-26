# Access control

Authentication is required unless a route is public. `RolesGuard` provides RBAC; `ShipmentPolicy` and `PolicyGuard` provide record-level ownership checks. The frontend uses dashboard `sections` only to choose which widgets to render; the server remains authoritative.

## Roles

| Role | Scope | Special access |
|---|---|---|
| `user` | Own shipments | Wallet, create and pay shipments |
| `staff` | All shipments | Read-only operations |
| `manager` | All shipments | Growth analytics |
| `admin` | All shipments | Growth analytics |

Signup always creates `user`; there is no public role-change route.

## Route summary

| Resource | User | Staff/manager/admin |
|---|---|---|
| Dashboard | Own data and wallet | Company data; manager/admin also see growth |
| Shipments | Own; can create and pay | Read-only company view |
| Wallet | Yes | No |

Queries apply ownership scope before aggregation, so customer KPIs cannot include another user's data. An inaccessible shipment returns `404` rather than confirming its existence.

The app is not multi-tenant; role and `sender_id` are the only access attributes.