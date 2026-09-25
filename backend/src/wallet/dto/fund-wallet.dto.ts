import { IsString, Matches } from 'class-validator';
import { MONEY_PATTERN } from '../../common/utils/money.util';

export class FundWalletDto {
  @IsString()
  @Matches(MONEY_PATTERN, { message: 'amount must be a positive decimal with at most 2 decimal places' })
  amount: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{8,64}$/, { message: 'reference must be 8-64 characters: letters, numbers, - or _' })
  reference: string;
}
