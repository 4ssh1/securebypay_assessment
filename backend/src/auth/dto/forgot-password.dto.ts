import { IsEmail, MaxLength } from 'class-validator';
import { NormalizeEmail } from '../../common/dto/transforms';

export class ForgotPasswordDto {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
