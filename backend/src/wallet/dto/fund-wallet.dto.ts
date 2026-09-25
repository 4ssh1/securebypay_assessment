import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MONEY_PATTERN } from '../../common/utils/money.util';

export class FundWalletDto {
  @ApiProperty({ example: '1000.50', pattern: '^\\d+(\\.\\d{1,2})?$' })
  @IsString()
  @Matches(MONEY_PATTERN, { message: 'amount must be a positive decimal with at most 2 decimal places' })
  amount: string;

  @ApiProperty({ example: 'funding_2026_09_25', minLength: 8, maxLength: 64, pattern: '^[A-Za-z0-9_-]{8,64}$' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{8,64}$/, { message: 'reference must be 8-64 characters: letters, numbers, - or _' })
  reference: string;
}
