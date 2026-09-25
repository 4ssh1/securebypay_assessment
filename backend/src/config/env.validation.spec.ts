import { validateEnv } from './env.validation';

const base = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  COOKIE_SECRET: 'c'.repeat(32),
  OTP_HMAC_SECRET: 'o'.repeat(32),
  CORS_ORIGINS: 'http://localhost:8080',
};

describe('validateEnv', () => {
  it('accepts a valid development configuration and applies defaults', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.MAIL_TRANSPORT).toBe('console');
  });

  it('fails fast on short secrets', () => {
    expect(() => validateEnv({ ...base, COOKIE_SECRET: 'short' })).toThrow(/COOKIE_SECRET/);
  });

  it('refuses wildcard CORS origins', () => {
    expect(() => validateEnv({ ...base, CORS_ORIGINS: '*' })).toThrow(/CORS_ORIGINS/);
  });

  it('refuses the console mail transport in production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).toThrow(/console/);
  });

  it('requires RESEND_API_KEY when the resend transport is selected', () => {
    expect(() => validateEnv({ ...base, MAIL_TRANSPORT: 'resend' })).toThrow(/RESEND_API_KEY/);
  });

  it('requires template ids when the resend transport is selected', () => {
    expect(() =>
      validateEnv({ ...base, MAIL_TRANSPORT: 'resend', RESEND_API_KEY: 'k' }),
    ).toThrow(/MAIL_TEMPLATE_SIGNUP_OTP/);
  });
});