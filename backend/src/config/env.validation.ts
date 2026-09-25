import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
  ValidateIf,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsIn(['true', 'false'])
  DATABASE_SSL: 'true' | 'false' = 'false';

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;

  @IsString()
  @MinLength(32)
  COOKIE_SECRET: string;

  @IsString()
  @MinLength(32)
  OTP_HMAC_SECRET: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  TRUST_PROXY_HOPS: number = 0;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  SESSION_IDLE_TTL_SECONDS: number = 7200;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  SESSION_ABSOLUTE_TTL_SECONDS: number = 43200;

  @IsIn(['console', 'resend'])
  MAIL_TRANSPORT: 'console' | 'resend' = 'console';

  @IsString()
  @IsNotEmpty()
  MAIL_FROM: string = 'SecureByPay <no-reply@securebypay.test>';

  @ValidateIf((o: EnvironmentVariables) => o.MAIL_TRANSPORT === 'resend')
  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY?: string;

  @ValidateIf((o: EnvironmentVariables) => o.MAIL_TRANSPORT === 'resend')
  @IsString()
  @IsNotEmpty()
  MAIL_TEMPLATE_SIGNUP_OTP?: string;

  @ValidateIf((o: EnvironmentVariables) => o.MAIL_TRANSPORT === 'resend')
  @IsString()
  @IsNotEmpty()
  MAIL_TEMPLATE_PASSWORD_RESET?: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  SEED_PASSWORD?: string;
}

export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, raw, { exposeDefaultValues: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const summary = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${summary}`);
  }

  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  if (origins.includes('*')) {
    throw new Error('Invalid environment configuration — CORS_ORIGINS must not contain "*"');
  }
  if (env.NODE_ENV === 'production' && env.MAIL_TRANSPORT === 'console') {
    throw new Error('Invalid environment configuration — MAIL_TRANSPORT=console is not allowed in production');
  }
  if (env.SESSION_ABSOLUTE_TTL_SECONDS < env.SESSION_IDLE_TTL_SECONDS) {
    throw new Error('Invalid environment configuration — absolute session TTL must be >= idle TTL');
  }
  return env;
}