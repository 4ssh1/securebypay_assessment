import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ClientInfo,type  ClientMeta } from '../common/decorators/client-meta.decorator';
import {type SessionUser } from '../common/interfaces/session-user.interface';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthUserDto, ForgotPasswordDto, LoginDto, ResendOtpDto, ResetPasswordDto, SignupDto, VerifyOtpDto } from './dto';
import { SessionCookieService } from './session-cookie.service';

const STRICT_LIMIT = { default: { limit: 5, ttl: 60_000 } };
const RESEND_LIMIT = { default: { limit: 3, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: SessionCookieService,
  ) {}

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @HttpCode(HttpStatus.OK)
  @Post('verify-signup-otp')
  @ApiResponse({ status: HttpStatus.OK, type: AuthUserDto, description: 'Verified user and authenticated session.' })
  async verifySignupOtp(
    @Body() dto: VerifyOtpDto,
    @ClientInfo() meta: ClientMeta,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.auth.verifySignupOtp(dto, meta);
    if (session) this.cookies.set(res, session.token, session.expiresAt);
    return AuthUserDto.from(user);
  }

  @Public()
  @Throttle(RESEND_LIMIT)
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    await this.auth.resendOtp(dto);
    return { message: 'If the account is awaiting verification, a new code has been sent.' };
  }

  @Public()
  @Throttle(RESEND_LIMIT)
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto);
    return { message: 'If an account exists for this email, a reset code has been sent.' };
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
    return { message: 'Password updated. Please sign in again.' };
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiResponse({ status: HttpStatus.OK, type: AuthUserDto, description: 'Authenticated user.' })
  async login(
    @Body() dto: LoginDto,
    @ClientInfo() meta: ClientMeta,
    @CurrentUser() current: SessionUser | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.auth.login(dto, meta, current);
    if (session) this.cookies.set(res, session.token, session.expiresAt);
    return AuthUserDto.from(user);
  }

  @ApiCookieAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: SessionUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user.sessionId);
    this.cookies.clear(res);
    return { message: 'Signed out.' };
  }

  @ApiCookieAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: SessionUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    this.cookies.clear(res);
    return { message: 'Signed out of all devices.' };
  }

  @ApiCookieAuth()
  @Get('me')
  @ApiResponse({ status: HttpStatus.OK, type: AuthUserDto })
  async me(@CurrentUser('id') userId: string) {
    return AuthUserDto.from(await this.auth.me(userId));
  }
}
