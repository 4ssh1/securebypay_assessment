import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ErrorCode } from '../common/constants/error-codes';
import { WalletTransactionType } from '../common/enums/wallet-transaction-type.enum';
import { AppException } from '../common/exceptions/app.exception';
import { isUniqueViolation } from '../common/utils/db-error.util';
import { toMinorUnits } from '../common/utils/money.util';
import { Wallet, WalletTransaction } from '../entities';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { MAX_FUNDING_MINOR, MIN_FUNDING_MINOR, WALLET_CURRENCY } from './wallet.constants';

export interface WalletSummary {
  balance: string;
  currency: string;
}

export interface FundingResult extends WalletSummary {
  reference: string;
  replayed: boolean;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly transactions: Repository<WalletTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getSummary(userId: string): Promise<WalletSummary> {
    const wallet = await this.getOrCreate(userId);
    return { balance: wallet.balance, currency: WALLET_CURRENCY };
  }

  async fund(userId: string, dto: FundWalletDto): Promise<FundingResult> {
    this.assertFundingLimits(dto.amount);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const wallet = await this.getOrCreate(userId, manager);
        await manager.insert(WalletTransaction, {
          walletId: wallet.id,
          type: WalletTransactionType.CREDIT,
          amount: dto.amount,
          reference: dto.reference,
          description: 'Wallet funding',
        });
        await manager.increment(Wallet, { id: wallet.id }, 'balance', dto.amount);
        const updated = await manager.findOneByOrFail(Wallet, { id: wallet.id });
        return { balance: updated.balance, currency: WALLET_CURRENCY, reference: dto.reference, replayed: false };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return this.replay(userId, dto);
      throw error;
    }
  }

  async debit(
    manager: EntityManager,
    userId: string,
    amount: string,
    reference: string,
    description: string,
  ): Promise<void> {
    const wallet = await this.getOrCreate(userId, manager);
    const result = await manager
      .createQueryBuilder()
      .update(Wallet)
      .set({ balance: () => 'balance - :amount' })
      .where('id = :id AND balance >= :amount', { id: wallet.id, amount })
      .execute();

    if (!result.affected) {
      throw new AppException(HttpStatus.PAYMENT_REQUIRED, ErrorCode.INSUFFICIENT_FUNDS, 'Insufficient wallet balance.');
    }

    await manager.insert(WalletTransaction, {
      walletId: wallet.id,
      type: WalletTransactionType.DEBIT,
      amount,
      reference,
      description,
    });
  }

  private async getOrCreate(userId: string, manager?: EntityManager): Promise<Wallet> {
    const repository = manager ? manager.getRepository(Wallet) : this.wallets;
    await repository.createQueryBuilder().insert().values({ userId }).orIgnore().execute();
    return repository.findOneByOrFail({ userId });
  }

  private async replay(userId: string, dto: FundWalletDto): Promise<FundingResult> {
    const wallet = await this.getOrCreate(userId);
    const existing = await this.transactions.findOneBy({ reference: dto.reference });
    const sameRequest =
      existing && existing.walletId === wallet.id && toMinorUnits(existing.amount) === toMinorUnits(dto.amount);

    if (!sameRequest) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.DUPLICATE_REFERENCE,
        'This reference has already been used for a different request.',
      );
    }
    return { balance: wallet.balance, currency: WALLET_CURRENCY, reference: dto.reference, replayed: true };
  }

  private assertFundingLimits(amount: string): void {
    const minor = toMinorUnits(amount);
    if (minor < MIN_FUNDING_MINOR || minor > MAX_FUNDING_MINOR) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Amount is outside the allowed funding range.',
        { min: '100.00', max: '5000000.00' },
      );
    }
  }
}
