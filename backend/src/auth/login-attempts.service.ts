import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ErrorCode } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import { sha256Hex } from '../common/utils/crypto.util';
import { REDIS_CLIENT, RedisKeys } from '../redis/redis.constants';

export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_LOCK_WINDOW_SECONDS = 15 * 60;

@Injectable()
export class LoginAttemptsService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private key(email: string): string {
    return RedisKeys.loginFailures(sha256Hex(email));
  }

  async assertNotLocked(email: string): Promise<void> {
    const key = this.key(email);
    const failures = Number((await this.redis.get(key)) ?? 0);
    if (failures >= MAX_LOGIN_FAILURES) {
      const ttl = await this.redis.ttl(key);
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.ACCOUNT_LOCKED,
        'Too many failed sign-in attempts. Please try again later.',
        { retryAfterSeconds: Math.max(ttl, 1) },
      );
    }
  }

  async recordFailure(email: string): Promise<void> {
    const key = this.key(email);
    await this.redis.multi().set(key, 0, 'EX', LOGIN_LOCK_WINDOW_SECONDS, 'NX').incr(key).exec();
  }

  async reset(email: string): Promise<void> {
    await this.redis.del(this.key(email));
  }
}
