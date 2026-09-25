import { PaymentStatus, ShipmentStatus, ShipmentType } from '../../common/enums/shipment.enums';
import { Shipment } from '../../entities';
import { WALLET_CURRENCY } from '../../wallet/wallet.constants';

export class ShipmentResponseDto {
  id: string;
  trackingId: string;
  sender: { id: string; name: string };
  receiver: { name: string };
  route: { pickUp: string; delivery: string };
  amount: string;
  currency: string;
  processingTimeHours: number;
  type: ShipmentType;
  status: ShipmentStatus;
  paymentStatus: PaymentStatus;
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
