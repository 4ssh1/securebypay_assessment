import { PaymentStatus, ShipmentStatus, ShipmentType } from '../../common/enums/shipment.enums';
import { Shipment } from '../../entities';
import { WALLET_CURRENCY } from '../../wallet/wallet.constants';
import { ApiProperty } from '@nestjs/swagger';

export class ShipmentResponseDto {
  @ApiProperty({ example: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b', format: 'uuid' })
  id: string;
  @ApiProperty({ example: 'MAF-100-234-291' })
  trackingId: string;
  @ApiProperty({ example: { id: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b', name: 'Bunmi Tanny' } })
  sender: { id: string; name: string };
  @ApiProperty({ example: { name: 'Mercy' } })
  receiver: { name: string };
  @ApiProperty({ example: { pickUp: 'Lagos, Nigeria', delivery: 'Oyo, Nigeria' } })
  route: { pickUp: string; delivery: string };
  @ApiProperty({ example: '3000.00' })
  amount: string;
  @ApiProperty({ example: WALLET_CURRENCY })
  currency: string;
  @ApiProperty({ example: 10 })
  processingTimeHours: number;
  @ApiProperty({ enum: ShipmentType, example: ShipmentType.DOMESTIC })
  type: ShipmentType;
  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.PENDING })
  status: ShipmentStatus;
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;
  @ApiProperty({ example: '2026-09-25T12:00:00.000Z', format: 'date-time' })
  createdAt: Date;

  static from(shipment: Shipment): ShipmentResponseDto {
    return {
      id: shipment.id,
      trackingId: shipment.trackingId,
      sender: {
        id: shipment.senderId,
        name: `${shipment.sender.firstName} ${shipment.sender.lastName}`,
      },
      receiver: { name: shipment.receiverName },
      route: { pickUp: shipment.pickupLocation, delivery: shipment.deliveryLocation },
      amount: shipment.amount,
      currency: WALLET_CURRENCY,
      processingTimeHours: shipment.processingTimeHours,
      type: shipment.type,
      status: shipment.status,
      paymentStatus: shipment.paymentStatus,
      createdAt: shipment.createdAt,
    };
  }
}
