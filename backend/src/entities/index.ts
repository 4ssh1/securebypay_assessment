import { OtpCode } from './otp-code.entity';
import { Session } from './session.entity';
import { Shipment } from './shipment.entity';
import { User } from './user.entity';
import { WalletTransaction } from './wallet-transaction.entity';
import { Wallet } from './wallet.entity';

export { OtpCode, Session, Shipment, User, Wallet, WalletTransaction };

export const ENTITIES = [User, Session, OtpCode, Shipment, Wallet, WalletTransaction];
