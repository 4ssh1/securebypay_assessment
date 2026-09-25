import { Role } from '../../common/enums/role.enum';

export interface SessionRecord {
  userId: string;
  role: Role;
  expiresAt: number;
  touchedAt: number;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}
