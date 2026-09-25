import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsUUID()
    @ApiProperty({ example: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b', format: 'uuid' })
    userId: string;

    @ApiProperty({ example: '482913', minLength: 6, maxLength: 6, pattern: '^\\d{6}$' })
    @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code: string;
}
