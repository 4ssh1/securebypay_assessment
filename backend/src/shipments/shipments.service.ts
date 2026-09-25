import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorCode } from '../common/constants/error-codes';
import { Paginated } from '../common/dto/paginated';
import { PaymentStatus, ShipmentStatus, ShipmentType } from '../common/enums/shipment.enums';
import { AppException } from '../common/exceptions/app.exception';
import { SessionUser } from '../common/interfaces/session-user.interface';
import { DateRange, GrowthWindow } from '../common/utils/date-range.util';
import { formatDecimal } from '../common/utils/money.util';
import { Shipment } from '../entities';
import { WalletService } from '../wallet/wallet.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ShipmentPolicy } from './policies/shipment.policy';
import { generateTrackingId } from './tracking-id.util';
import { isUniqueViolation } from '../common/utils/db-error.util';

export interface ShipmentCounts {
  total: number;
  exports: number;
  imports: number;
  domestic: number;
}

export interface GrowthPoint {
  date: string;
  shipments: number;
  revenue: string;
}

export interface PaymentResult {
  shipment: ShipmentResponseDto;
  walletBalance: string;
}

export const RECENT_SHIPMENTS_LIMIT = 3;
const TRACKING_ID_MAX_ATTEMPTS = 5;

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
    private readonly dataSource: DataSource,
    private readonly policy: ShipmentPolicy,
    private readonly wallet: WalletService,
  ) {}

  async list(user: SessionUser, query: ListShipmentsQueryDto): Promise<Paginated<ShipmentResponseDto>> {
    const qb = this.shipments
      .createQueryBuilder('s')
      .leftJoin('s.sender', 'sender')
      .addSelect(['sender.id', 'sender.firstName', 'sender.lastName']);
    this.policy.applyScope(qb, 's', user);

    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.paymentStatus) qb.andWhere('s.paymentStatus = :paymentStatus', { paymentStatus: query.paymentStatus });
    if (query.type) qb.andWhere('s.type = :type', { type: query.type });

    const [rows, total] = await qb
      .orderBy('s.createdAt', 'DESC')
      .addOrderBy('s.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return new Paginated(rows.map(ShipmentResponseDto.from), query.page, query.limit, total);
  }

  async create(user: SessionUser, dto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    for (let attempt = 0; attempt < TRACKING_ID_MAX_ATTEMPTS; attempt++) {
      try {
        const saved = await this.shipments.save(
          this.shipments.create({
            trackingId: generateTrackingId(),
            senderId: user.id,
            receiverName: dto.receiverName,
            pickupLocation: dto.pickupLocation,
            deliveryLocation: dto.deliveryLocation,
            type: dto.type,
            amount: dto.amount,
            processingTimeHours: dto.processingTimeHours,
            status: ShipmentStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
          }),
        );
        return ShipmentResponseDto.from((await this.findOneWithSender(saved.id))!);
      } catch (error) {
        if (isUniqueViolation(error)) continue; // tracking ID collision — retry with a new one
        throw error;
      }
    }
    throw new AppException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      'Could not generate a unique tracking ID. Please try again.',
    );
  }

  async recent(user: SessionUser, limit: number = RECENT_SHIPMENTS_LIMIT): Promise<ShipmentResponseDto[]> {
    const qb = this.shipments
      .createQueryBuilder('s')
      .leftJoin('s.sender', 'sender')
      .addSelect(['sender.id', 'sender.firstName', 'sender.lastName']);
    this.policy.applyScope(qb, 's', user);

    const rows = await qb.orderBy('s.createdAt', 'DESC').addOrderBy('s.id', 'DESC').take(limit).getMany();
    return rows.map(ShipmentResponseDto.from);
  }

  findOneWithSender(id: string): Promise<Shipment | null> {
    return this.shipments
      .createQueryBuilder('s')
      .leftJoin('s.sender', 'sender')
      .addSelect(['sender.id', 'sender.firstName', 'sender.lastName'])
      .where('s.id = :id', { id })
      .getOne();
  }

  async countByType(user: SessionUser, range: DateRange): Promise<ShipmentCounts> {
    const qb = this.shipments
      .createQueryBuilder('s')
      .select('s.type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('s.createdAt >= :from AND s.createdAt < :to', range)
      .groupBy('s.type');
    const rows = await this.policy.applyScope(qb, 's', user).getRawMany<{ type: ShipmentType; count: number }>();

    const byType = new Map(rows.map((r) => [r.type, Number(r.count)]));
    const exports = byType.get(ShipmentType.EXPORT) ?? 0;
    const imports = byType.get(ShipmentType.IMPORT) ?? 0;
    const domestic = byType.get(ShipmentType.DOMESTIC) ?? 0;
    return { total: exports + imports + domestic, exports, imports, domestic };
  }

  async growthSeries(user: SessionUser, window: GrowthWindow): Promise<GrowthPoint[]> {
    const qb = this.shipments
      .createQueryBuilder('s')
      .select(`to_char(date_trunc('${window.unit}', s.createdAt AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`, 'bucket')
      .addSelect('COUNT(*)::int', 'shipments')
      .addSelect('COALESCE(SUM(s.amount), 0)::text', 'revenue')
      .where('s.createdAt >= :from AND s.createdAt < :to', { from: window.from, to: window.to })
      .groupBy('bucket');
    const rows = await this.policy
      .applyScope(qb, 's', user)
      .getRawMany<{ bucket: string; shipments: number; revenue: string }>();

    const byBucket = new Map(rows.map((r) => [r.bucket, r]));
    return window.buckets.map((date) => {
      const row = byBucket.get(date);
      return { date, shipments: row ? Number(row.shipments) : 0, revenue: formatDecimal(row?.revenue ?? '0') };
    });
  }

  async pay(shipment: Shipment, user: SessionUser): Promise<PaymentResult> {
    await this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Shipment, {
        where: { id: shipment.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Shipment not found.');

      if (locked.paymentStatus === PaymentStatus.PAID) {
        throw new AppException(HttpStatus.CONFLICT, ErrorCode.ALREADY_PAID, 'This shipment has already been paid for.');
      }
      if (locked.status === ShipmentStatus.CANCELLED) {
        throw new AppException(HttpStatus.CONFLICT, ErrorCode.SHIPMENT_NOT_PAYABLE, 'A cancelled shipment cannot be paid for.');
      }

      await this.wallet.debit(
        manager,
        user.id,
        locked.amount,
        `SHIPMENT_PAYMENT:${locked.id}`,
        `Payment for shipment ${locked.trackingId}`,
      );
      await manager.update(Shipment, { id: locked.id }, { paymentStatus: PaymentStatus.PAID });
    });

    const updated = await this.findOneWithSender(shipment.id);
    const { balance } = await this.wallet.getSummary(user.id);
    return { shipment: ShipmentResponseDto.from(updated as Shipment), walletBalance: balance };
  }
}
