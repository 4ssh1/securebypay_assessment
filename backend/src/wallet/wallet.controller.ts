import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { WALLET_ROLES } from '../common/enums/role-groups';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiCookieAuth()
@Roles(...WALLET_ROLES)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  summary(@CurrentUser('id') userId: string) {
    return this.wallet.getSummary(userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('fund')
  fund(@CurrentUser('id') userId: string, @Body() dto: FundWalletDto) {
    return this.wallet.fund(userId, dto);
  }
}
