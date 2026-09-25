import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../common/constants/password-policy';
import { NormalizeEmail, StripPhoneFormatting, Trim } from '../../common/dto/transforms';

export class SignupDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @StripPhoneFormatting()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be a valid international phone number' })
  phone: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_PATTERN, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password: string;
}
