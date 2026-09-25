export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const RedisKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  otpCooldown: (userId: string, purpose: string) => `otp:cooldown:${userId}:${purpose}`,
  loginFailures: (emailHash: string) => `auth:fail:${emailHash}`,
} as const;
