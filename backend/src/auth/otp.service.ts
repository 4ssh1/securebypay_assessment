import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import Redis from 'ioredis';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { ErrorCode } from '../common/constants/error-codes';
import { OtpPurpose } from '../common/enums/otp-purpose.enum';
import { AppException } from '../common/exceptions/app.exception';
import { hmacSha256Hex, safeEqualHex } from '../common/utils/crypto.util';
import { AppConfigService } from '../config/app-config.service';
import { OtpCode, User } from '../entities';
import { MailerService } from '../mailer/mailer.service';
import { MailMessage } from '../mailer/mail.transport';
import { REDIS_CLIENT, RedisKeys } from '../redis/redis.constants';

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

type OtpRecipient = Pick<User, 'id' | 'email' | 'firstName'>;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode) private readonly otpCodes: Repository<OtpCode>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: AppConfigService,
    private readonly mailer: MailerService,
  ) {}

  async generateAndSend(user: OtpRecipient, purpose: OtpPurpose): Promise<void> {
    await this.acquireCooldown(user.id, purpose);

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.otpCodes.update({ userId: user.id, purpose, consumedAt: IsNull() }, { consumedAt: new Date() });
    const record = await this.otpCodes.save(
      this.otpCodes.create({
        userId: user.id,
        purpose,
        codeHash: this.hash(user.id, purpose, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      }),
    );

    try {
      await this.mailer.send(this.buildMail(user, purpose, code));
    } catch (error) {
      await this.otpCodes.delete(record.id);
      await this.redis.del(RedisKeys.otpCooldown(user.id, purpose));
      throw error;
    }
  }

  async verify(userId: string, purpose: OtpPurpose, code: string): Promise<void> {
    const record = await this.otpCodes.findOne({
      where: { userId, purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!record || record.expiresAt.getTime() <= Date.now()) this.fail();

    const counted = await this.otpCodes.update(
      {
        id: record!.id,
        consumedAt: IsNull(),
        attempts: LessThan(OTP_MAX_ATTEMPTS),
        expiresAt: MoreThan(new Date()),
      },
      { attempts: () => 'attempts + 1' },
    );
    if (!counted.affected) this.fail();

    if (!safeEqualHex(record!.codeHash, this.hash(userId, purpose, code))) this.fail();

    const consumed = await this.otpCodes.update(
      { id: record!.id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
    if (!consumed.affected) this.fail();
  }

  private buildMail(user: OtpRecipient, purpose: OtpPurpose, code: string): MailMessage {
    const templateId =
      purpose === OtpPurpose.SIGNUP_VERIFY
        ? this.config.mailTemplates.signupOtp
        : this.config.mailTemplates.passwordReset;

    return {
      to: user.email,
      templateId,
      variables: {
        firstName: user.firstName,
        code,
        ttlMinutes: OTP_TTL_MINUTES,
      },
    };
  }

  private hash(userId: string, purpose: OtpPurpose, code: string): string {
    return hmacSha256Hex(this.config.otpHmacSecret, `${userId}:${purpose}:${code}`);
  }

  private async acquireCooldown(userId: string, purpose: OtpPurpose): Promise<void> {
    const key = RedisKeys.otpCooldown(userId, purpose);
    const acquired = await this.redis.set(key, '1', 'EX', OTP_RESEND_COOLDOWN_SECONDS, 'NX');
    if (acquired) return;

    const ttl = await this.redis.ttl(key);
    throw new AppException(
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.OTP_COOLDOWN,
      'Please wait before requesting another code.',
      { retryAfterSeconds: Math.max(ttl, 1) },
    );
  }

  private fail(): never {
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.OTP_INVALID,
      'The verification code is invalid or has expired.',
    );
  }
}