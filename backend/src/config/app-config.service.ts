import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  private get<K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] {
    return this.config.get(key, { infer: true }) as EnvironmentVariables[K];
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get port(): number {
    return this.get('PORT');
  }

  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  get databaseSsl(): boolean {
    return this.get('DATABASE_SSL') === 'true';
  }

  get redisUrl(): string {
    return this.get('REDIS_URL');
  }

  get cookieSecret(): string {
    return this.get('COOKIE_SECRET');
  }

  get otpHmacSecret(): string {
    return this.get('OTP_HMAC_SECRET');
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  get trustProxyHops(): number {
    return this.get('TRUST_PROXY_HOPS');
  }

  get sessionIdleTtlSeconds(): number {
    return this.get('SESSION_IDLE_TTL_SECONDS');
  }

  get sessionAbsoluteTtlSeconds(): number {
    return this.get('SESSION_ABSOLUTE_TTL_SECONDS');
  }

  get sessionCookieName(): string {
    return this.isProduction ? '__Host-sid' : 'sid';
  }

  get mailTransport(): 'console' | 'resend' {
    return this.get('MAIL_TRANSPORT');
  }

  get mailFrom(): string {
    return this.get('MAIL_FROM');
  }

  get resend() {
    return {
      apiKey: this.get('RESEND_API_KEY') as string,
    };
  }

  get mailTemplates() {
    return {
      signupOtp: this.get('MAIL_TEMPLATE_SIGNUP_OTP') as string,
      passwordReset: this.get('MAIL_TEMPLATE_PASSWORD_RESET') as string,
    };
  }

  get swaggerEnabled(): boolean {
    return this.get('SWAGGER_ENABLED') === 'true';
  }
}