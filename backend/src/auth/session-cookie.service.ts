import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class SessionCookieService {
  constructor(private readonly config: AppConfigService) {}

  private get baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      signed: true,
      path: '/',
    };
  }

  set(res: Response, token: string, expiresAt: Date): void {
    res.cookie(this.config.sessionCookieName, token, { ...this.baseOptions, expires: expiresAt });
  }

  clear(res: Response): void {
    res.clearCookie(this.config.sessionCookieName, this.baseOptions);
  }

  read(req: Request): string | undefined {
    const value: unknown = req.signedCookies?.[this.config.sessionCookieName];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
