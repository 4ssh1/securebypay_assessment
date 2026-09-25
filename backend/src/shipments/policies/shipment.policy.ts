import { HttpStatus, Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import { COMPANY_WIDE_ROLES } from '../../common/enums/role-groups';
import { Role } from '../../common/enums/role.enum';
import { AppException } from '../../common/exceptions/app.exception';
import { SessionUser } from '../../common/interfaces/session-user.interface';
import { Shipment } from '../../entities';

export type DataScope = 'own' | 'all';

@Injectable()
export class ShipmentPolicy {
  scopeOf(user: SessionUser): DataScope {
    if (user.role === Role.USER) return 'own';
    if (COMPANY_WIDE_ROLES.includes(user.role)) return 'all';
    throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, 'Access denied.');
  }

  applyScope<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, alias: string, user: SessionUser): SelectQueryBuilder<T> {
    if (this.scopeOf(user) === 'own') {
      qb.andWhere(`${alias}.senderId = :scopeUserId`, { scopeUserId: user.id });
    }
    return qb;
  }

  canRead(user: SessionUser, shipment: Shipment): boolean {
    return this.scopeOf(user) === 'all' || shipment.senderId === user.id;
  }

  canPay(user: SessionUser, shipment: Shipment): boolean {
    return user.role === Role.USER && shipment.senderId === user.id;
  }
}
