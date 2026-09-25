import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from '../entities';
import { WalletModule } from '../wallet/wallet.module';
import { ShipmentPayHandler, ShipmentReadHandler } from './policies/shipment-access.handlers';
import { ShipmentPolicy } from './policies/shipment.policy';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment]), WalletModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentPolicy, ShipmentReadHandler, ShipmentPayHandler],
  exports: [ShipmentsService, ShipmentPolicy],
})
export class ShipmentsModule {}
