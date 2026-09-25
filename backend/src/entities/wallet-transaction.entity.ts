import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { WalletTransactionType } from '../common/enums/wallet-transaction-type.enum';
import { Wallet } from './wallet.entity';

@Entity('wallet_transactions')
@Index(['walletId'])
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ type: 'enum', enum: WalletTransactionType, enumName: 'wallet_transaction_type' })
  type: WalletTransactionType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ length: 100, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
