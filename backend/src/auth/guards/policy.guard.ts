import { CanActivate, ExecutionContext, HttpStatus, Injectable, Type } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { POLICY_KEY } from '../decorators/check-policy.decorator';
import { PolicyHandler } from '../interfaces/policy.interface';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlers = this.reflector.getAllAndOverride<Type<PolicyHandler>[] | undefined>(POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!handlers?.length) return true;

    const req = context.switchToHttp().getRequest<Request>();
    for (const handlerType of handlers) {
      const handler = this.moduleRef.get(handlerType, { strict: false });
      if (!(await handler.handle(req))) {
        throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, 'Access to this resource is denied.');
      }
    }
    return true;
  }
}
