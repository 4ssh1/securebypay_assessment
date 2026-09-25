import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../common/constants/error-codes';
import { ClientMeta } from '../common/decorators/client-meta.decorator';
import { OtpPurpose } from '../common/enums/otp-purpose.enum';
import { Role } from '../common/enums/role.enum';
import { AppException } from '../common/exceptions/app.exception';
import { SessionUser } from '../common/interfaces/session-user.interface';
import { isUniqueViolation } from '../common/utils/db-error.util';
import { User } from '../entities';
import { ForgotPasswordDto, LoginDto, ResendOtpDto, ResetPasswordDto, SignupDto, VerifyOtpDto } from './dto';
import { IssuedSession } from './interfaces/session.interface';
import { LoginAttemptsService } from './login-attempts.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

export interface AuthResult {
  user: User;
  session: IssuedSession | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwords: PasswordService,
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly attempts: LoginAttemptsService,
  ) {}

  async signup(dto: SignupDto): Promise<{ userId: string }> {
    const existing = await this.users.exists({ where: [{ email: dto.email }, { phone: dto.phone }] });
    if (existing) this.accountExists();

    const passwordHash = await this.passwords.hash(dto.password);
    let user: User;
    try {
      user = await this.users.save(
        this.users.create({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: Role.USER,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) this.accountExists();
      throw error;
    }

    await this.otp.generateAndSend(user, OtpPurpose.SIGNUP_VERIFY);
    return { userId: user.id };
  }

  async verifySignupOtp(dto: VerifyOtpDto, meta: ClientMeta): Promise<AuthResult> {
    const user = await this.users.findOneBy({ id: dto.userId, isEmailVerified: false, isActive: true });
    if (!user) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'The verification code is invalid or has expired.',
      );
    }

    await this.otp.verify(user.id, OtpPurpose.SIGNUP_VERIFY, dto.code);
    await this.users.update({ id: user.id }, { isEmailVerified: true });
    user.isEmailVerified = true;

    return { user, session: await this.sessions.create(user, meta) };
  }

  async resendOtp(dto: ResendOtpDto): Promise<void> {
    const user = await this.users.findOneBy({ id: dto.userId, isEmailVerified: false, isActive: true });
    if (user) await this.otp.generateAndSend(user, OtpPurpose.SIGNUP_VERIFY);
  }

  async login(dto: LoginDto, meta: ClientMeta, current?: SessionUser): Promise<AuthResult> {
    await this.attempts.assertNotLocked(dto.email);

    const user = await this.users.findOneBy({ email: dto.email });
    const passwordOk = user
      ? await this.passwords.verify(user.passwordHash, dto.password)
      : await this.passwords.verifyAgainstDummy(dto.password);

    if (!user || !passwordOk || !user.isActive) {
      await this.attempts.recordFailure(dto.email);
      throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password.');
    }

    if (!user.isEmailVerified) {
      throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.EMAIL_NOT_VERIFIED, 'Email address has not been verified.', {
        userId: user.id,
      });
    }

    await this.attempts.reset(dto.email);

    if (current?.id === user.id) return { user, session: null };
    if (current) await this.sessions.revoke(current.sessionId);

    return { user, session: await this.sessions.create(user, meta) };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revoke(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.revokeAllForUser(userId);
  }

  async me(userId: string): Promise<User> {
    return this.users.findOneByOrFail({ id: userId });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.users.findOneBy({ email: dto.email, isEmailVerified: true, isActive: true });
    if (user) await this.otp.generateAndSend(user, OtpPurpose.PASSWORD_RESET);
    // Same response regardless of whether the account exists — avoids confirming registered emails.
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.users.findOneBy({ email: dto.email, isEmailVerified: true, isActive: true });
    if (!user) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        'The verification code is invalid or has expired.',
      );
    }

    await this.otp.verify(user.id, OtpPurpose.PASSWORD_RESET, dto.code);
    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.users.update({ id: user.id }, { passwordHash });
    // Password changed — every existing session (this device and any other) is revoked.
    await this.sessions.revokeAllForUser(user.id);
  }

  private accountExists(): never {
    throw new AppException(
      HttpStatus.CONFLICT,
      ErrorCode.ACCOUNT_EXISTS,
      'An account with this email or phone number already exists.',
    );
  }
}
