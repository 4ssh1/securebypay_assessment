import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ResendOtpDto {
  @IsUUID()
    @ApiProperty({ example: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b', format: 'uuid' })
    userId: string;
}
