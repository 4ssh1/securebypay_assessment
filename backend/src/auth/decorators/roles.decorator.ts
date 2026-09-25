import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';

export const ROLES_KEY = 'auth:roles';
export const Roles = (...roles: readonly Role[]) => SetMetadata(ROLES_KEY, roles);
