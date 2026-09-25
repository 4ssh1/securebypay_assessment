import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { NormalizeEmail } from '../../common/dto/transforms';

export class LoginDto {
  @NormalizeEmail()
    @ApiProperty({ example: 'bunmi.tanny@example.com', maxLength: 255, format: 'email' })
    @IsEmail()
  @MaxLength(255)
  email: string;

    @ApiProperty({ example: 'SecurePay#2026', maxLength: 128, format: 'password' })
    @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
