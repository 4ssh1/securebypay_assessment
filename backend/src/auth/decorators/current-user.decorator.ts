import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { SessionUser } from '../../common/interfaces/session-user.interface';

export const CurrentUser = createParamDecorator(
  (field: keyof SessionUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<Request>().user;
    return field ? user?.[field] : user;
  },
);
