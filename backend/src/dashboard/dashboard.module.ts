import { Module } from '@nestjs/common';
import { ShipmentsModule } from '../shipments/shipments.module';
import { WalletModule } from '../wallet/wallet.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ShipmentsModule, WalletModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
