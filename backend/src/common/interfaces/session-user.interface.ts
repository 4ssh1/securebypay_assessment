import { Role } from '../enums/role.enum';

export interface SessionUser {
  id: string;
  role: Role;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      user?: SessionUser;
      resource?: unknown;
    }
  }
}
