import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode } from '../constants/error-codes';
import { AppException } from '../exceptions/app.exception';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const origin = req.headers.origin;
    if (SAFE_METHODS.has(req.method) || !origin || this.isAllowed(origin, req.headers.host)) {
      return next();
    }
    throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.ORIGIN_NOT_ALLOWED, 'Origin not allowed');
  }

  private isAllowed(origin: string, host?: string): boolean {
    if (this.config.corsOrigins.includes(origin)) return true;
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
}
