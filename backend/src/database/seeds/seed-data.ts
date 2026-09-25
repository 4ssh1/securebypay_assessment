import { PaymentStatus, ShipmentStatus, ShipmentType } from '../../common/enums/shipment.enums';
import { Role } from '../../common/enums/role.enum';

export interface SeedUser {
  key: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  walletBalance?: string;
}

export const SEED_USERS: SeedUser[] = [
  { key: 'admin', email: 'admin@securebypay.test', phone: '+2348010000001', firstName: 'Ada', lastName: 'Admin', role: Role.ADMIN },
  { key: 'manager', email: 'manager@securebypay.test', phone: '+2348010000002', firstName: 'Musa', lastName: 'Manager', role: Role.MANAGER },
  { key: 'staff', email: 'staff@securebypay.test', phone: '+2348010000003', firstName: 'Sola', lastName: 'Staff', role: Role.STAFF },
  { key: 'user', email: 'user@securebypay.test', phone: '+2348010000004', firstName: 'Bunmi', lastName: 'Tanny', role: Role.USER, walletBalance: '3000000.28' },
  { key: 'user2', email: 'user2@securebypay.test', phone: '+2348010000005', firstName: 'Chidi', lastName: 'Okafor', role: Role.USER, walletBalance: '250000.00' },
];

export const MONTHLY_TEMPLATE = [22, 26, 24, 20, 28, 25, 21, 30, 27, 36, 18, 34];

export const NIGERIAN_CITIES = [
  'Lagos, Nigeria',
  'Abuja, Nigeria',
  'Oyo, Nigeria',
  'Port Harcourt, Nigeria',
  'Kano, Nigeria',
  'Enugu, Nigeria',
  'Ibadan, Nigeria',
];

export const FOREIGN_CITIES = ['Accra, Ghana', 'London, United Kingdom', 'Dubai, UAE', 'Guangzhou, China', 'Nairobi, Kenya'];

export const RECEIVERS = ['Mercy Adeyemi', 'Tunde Bakare', 'Ngozi Eze', 'Ibrahim Sani', 'Funke Alade', 'Emeka Nwosu', 'Halima Yusuf'];

export const TYPE_WEIGHTS: [ShipmentType, number][] = [
  [ShipmentType.EXPORT, 0.35],
  [ShipmentType.IMPORT, 0.3],
  [ShipmentType.DOMESTIC, 0.35],
];

export const RECENT_STATUSES: ShipmentStatus[] = [ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELAYED];

export const SHOWCASE_SHIPMENTS = [
  { trackingId: 'MAF-100-234-291', hoursAgo: 2, status: ShipmentStatus.IN_TRANSIT, paymentStatus: PaymentStatus.PAID },
  { trackingId: 'MAF-100-234-292', hoursAgo: 5, status: ShipmentStatus.DELAYED, paymentStatus: PaymentStatus.UNPAID },
];
