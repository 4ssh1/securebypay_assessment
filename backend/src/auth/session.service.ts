import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { IsNull, Repository } from 'typeorm';
import { ClientMeta } from '../common/decorators/client-meta.decorator';
import { Role } from '../common/enums/role.enum';
import { SessionUser } from '../common/interfaces/session-user.interface';
import { randomTokenHex, sha256Hex } from '../common/utils/crypto.util';
import { AppConfigService } from '../config/app-config.service';
import { Session } from '../entities';
import { REDIS_CLIENT, RedisKeys } from '../redis/redis.constants';
import { IssuedSession, SessionRecord } from './interfaces/session.interface';

const DB_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    private readonly config: AppConfigService,
  ) {}

  async create(user: { id: string; role: Role }, meta: ClientMeta): Promise<IssuedSession> {
    const token = randomTokenHex();
    const id = sha256Hex(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionAbsoluteTtlSeconds * 1000);

    await this.sessions.insert({
      id,
      userId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      lastSeenAt: now,
      expiresAt,
      revokedAt: null,
    });
    await this.cacheSet(id, {
      userId: user.id,
      role: user.role,
      expiresAt: expiresAt.getTime(),
      touchedAt: now.getTime(),
    });

    return { token, expiresAt };
  }

  async validate(token: string): Promise<SessionUser | null> {
    const id = sha256Hex(token);
    const cached = await this.cacheGet(id);

    if (cached) {
      if (cached.expiresAt <= Date.now()) {
        await this.revoke(id);
        return null;
      }
      await this.slide(id, cached);
      return { id: cached.userId, role: cached.role, sessionId: id };
    }
    return this.rehydrate(id);
  }

  async revoke(sessionId: string): Promise<void> {
    await this.cacheDelete([sessionId]);
    await this.sessions.update({ id: sessionId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const active = await this.sessions.find({ where: { userId, revokedAt: IsNull() }, select: { id: true } });
    await this.cacheDelete(active.map((s) => s.id));
    await this.sessions.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private async rehydrate(id: string): Promise<SessionUser | null> {
    const row = await this.sessions.findOne({
      where: { id, revokedAt: IsNull() },
      relations: { user: true },
    });
    const now = Date.now();
    const idleMs = this.config.sessionIdleTtlSeconds * 1000;

    if (!row || !row.user.isActive) return null;
    if (row.expiresAt.getTime() <= now || row.lastSeenAt.getTime() + idleMs <= now) return null;

    await this.sessions.update({ id }, { lastSeenAt: new Date(now) });
    await this.cacheSet(id, {
      userId: row.userId,
      role: row.user.role,
      expiresAt: row.expiresAt.getTime(),
      touchedAt: now,
    });
    return { id: row.userId, role: row.user.role, sessionId: id };
  }

  private async slide(id: string, record: SessionRecord): Promise<void> {
    const now = Date.now();
    if (now - record.touchedAt >= DB_TOUCH_INTERVAL_MS) {
      await this.sessions.update({ id }, { lastSeenAt: new Date(now) });
      await this.cacheSet(id, { ...record, touchedAt: now });
      return;
    }
    const ttl = this.ttlFor(record);
    if (ttl > 0) await this.safely(() => this.redis.expire(RedisKeys.session(id), ttl));
  }

  private ttlFor(record: SessionRecord): number {
    const remaining = Math.floor((record.expiresAt - Date.now()) / 1000);
    return Math.min(this.config.sessionIdleTtlSeconds, remaining);
  }

  private async cacheSet(id: string, record: SessionRecord): Promise<void> {
    const ttl = this.ttlFor(record);
    if (ttl <= 0) return;
    await this.safely(() => this.redis.set(RedisKeys.session(id), JSON.stringify(record), 'EX', ttl));
  }

  private async cacheGet(id: string): Promise<SessionRecord | null> {
    const raw = await this.safely(() => this.redis.get(RedisKeys.session(id)));
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  }

  private async cacheDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.redis.del(...ids.map((id) => RedisKeys.session(id)));
  }

  private async safely<T>(operation: () => Promise<T>): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logger.warn(`Redis unavailable, falling back to database: ${(error as Error).message}`);
      return null;
    }
  }
}
