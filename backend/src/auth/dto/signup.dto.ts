import { ApiProperty } from '@nestjs/swagger';
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
    @ApiProperty({ example: 'Bunmi', maxLength: 80 })
    @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @Trim()
    @ApiProperty({ example: 'Tanny', maxLength: 80 })
    @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @NormalizeEmail()
    @ApiProperty({ example: 'bunmi.tanny@example.com', maxLength: 255, format: 'email' })
    @IsEmail()
  @MaxLength(255)
  email: string;

  @StripPhoneFormatting()
    @ApiProperty({ example: '+2348010000004', pattern: '^\\+?[1-9]\\d{7,14}$' })
    @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be a valid international phone number' })
  phone: string;

    @ApiProperty({ example: 'SecurePay#2026', minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH, format: 'password' })
    @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_PATTERN, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password: string;
}
