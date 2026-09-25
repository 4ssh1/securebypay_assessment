import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentStatus, ShipmentStatus, ShipmentType } from '../common/enums/shipment.enums';
import { User } from './user.entity';

@Entity('shipments')
@Index(['senderId', 'createdAt'])
@Index(['status'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 32, unique: true })
  trackingId: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ length: 120 })
  receiverName: string;

  @Column({ length: 160 })
  pickupLocation: string;

  @Column({ length: 160 })
  deliveryLocation: string;

  @Column({ type: 'enum', enum: ShipmentType, enumName: 'shipment_type' })
  type: ShipmentType;

  @Column({ type: 'enum', enum: ShipmentStatus, enumName: 'shipment_status', default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ type: 'enum', enum: PaymentStatus, enumName: 'payment_status', default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'int' })
  processingTimeHours: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
