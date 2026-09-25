import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { NormalizeEmail } from '../../common/dto/transforms';

export class ForgotPasswordDto {
  @NormalizeEmail()
    @ApiProperty({ example: 'bunmi.tanny@example.com', maxLength: 255, format: 'email' })
    @IsEmail()
  @MaxLength(255)
  email: string;
}
