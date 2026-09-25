import { HttpStatus, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { PolicyHandler } from '../../auth/interfaces/policy.interface';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { SessionUser } from '../../common/interfaces/session-user.interface';
import { Shipment } from '../../entities';
import { ShipmentsService } from '../shipments.service';
import { ShipmentPolicy } from './shipment.policy';

@Injectable()
abstract class ShipmentResourceHandler implements PolicyHandler {
  constructor(
    protected readonly shipments: ShipmentsService,
    protected readonly policy: ShipmentPolicy,
  ) {}

  protected abstract isAllowed(user: SessionUser, shipment: Shipment): boolean;

  async handle(req: Request): Promise<boolean> {
    const id = req.params.id;
    const shipment =
      req.user && typeof id === 'string' && isUUID(id) ? await this.shipments.findOneWithSender(id) : null;

    if (!req.user || !shipment || !this.isAllowed(req.user, shipment)) {
      throw new AppException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Shipment not found.');
    }
    req.resource = shipment;
    return true;
  }
}

@Injectable()
export class ShipmentReadHandler extends ShipmentResourceHandler {
  protected isAllowed(user: SessionUser, shipment: Shipment): boolean {
    return this.policy.canRead(user, shipment);
  }
}

@Injectable()
export class ShipmentPayHandler extends ShipmentResourceHandler {
  protected isAllowed(user: SessionUser, shipment: Shipment): boolean {
    return this.policy.canPay(user, shipment);
  }
}
