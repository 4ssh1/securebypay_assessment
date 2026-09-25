import { Role } from './role.enum';

export const ALL_ROLES: readonly Role[] = Object.values(Role);
export const WALLET_ROLES: readonly Role[] = [Role.USER];
export const ANALYTICS_ROLES: readonly Role[] = [Role.MANAGER, Role.ADMIN];
export const COMPANY_WIDE_ROLES: readonly Role[] = [Role.STAFF, Role.MANAGER, Role.ADMIN];
