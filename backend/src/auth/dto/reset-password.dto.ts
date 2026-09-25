import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../common/constants/password-policy';
import { NormalizeEmail } from '../../common/dto/transforms';

export class ResetPasswordDto {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_PATTERN, { message: PASSWORD_COMPLEXITY_MESSAGE })
  newPassword: string;
}
