import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpCode, Session, User } from '../entities';
import { MailerModule } from '../mailer/mailer.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAttemptsService } from './login-attempts.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';
import { SessionCookieService } from './session-cookie.service';
import { SessionService } from './session.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, OtpCode]), MailerModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    SessionService,
    SessionCookieService,
    PasswordService,
    LoginAttemptsService,
  ],
  exports: [SessionService, SessionCookieService, PasswordService],
})
export class AuthModule {}
