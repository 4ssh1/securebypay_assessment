import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface ClientMeta {
  ip: string;
  userAgent: string;
}

export const ClientInfo = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientMeta => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return {
    ip: req.ip ?? 'unknown',
    userAgent: (req.headers['user-agent'] ?? 'unknown').slice(0, 255),
  };
});
