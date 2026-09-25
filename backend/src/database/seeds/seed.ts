import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PaymentStatus, ShipmentStatus, ShipmentType } from '../../common/enums/shipment.enums';
import { WalletTransactionType } from '../../common/enums/wallet-transaction-type.enum';
import { PasswordService } from '../../auth/password.service';
import { Shipment, User, Wallet, WalletTransaction } from '../../entities';
import { buildDataSourceOptions } from '../database.options';
import {
  FOREIGN_CITIES,
  MONTHLY_TEMPLATE,
  NIGERIAN_CITIES,
  RECEIVERS,
  RECENT_STATUSES,
  SEED_USERS,
  SHOWCASE_SHIPMENTS,
  TYPE_WEIGHTS,
} from './seed-data';

const DAY_MS = 86_400_000;

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Seeding is disabled in production.');
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12) throw new Error('SEED_PASSWORD (min 12 chars) is required.');

  const dataSource = await new DataSource(
    buildDataSourceOptions({ url: process.env.DATABASE_URL as string, ssl: process.env.DATABASE_SSL === 'true' }),
  ).initialize();

  try {
    const users = dataSource.getRepository(User);
    if (await users.exists({ where: { email: SEED_USERS[0].email } })) {
      console.log('Seed data already present. Nothing to do.');
      return;
    }

    const passwordHash = await new PasswordService().hash(password);
    const now = new Date();
    const rand = mulberry32(20260924);
    const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
    const usedTrackingIds = new Set(SHOWCASE_SHIPMENTS.map((s) => s.trackingId));

    const newTrackingId = (): string => {
      for (;;) {
        const part = () => String(100 + Math.floor(rand() * 900));
        const id = `MAF-${part()}-${part()}-${part()}`;
        if (!usedTrackingIds.has(id)) {
          usedTrackingIds.add(id);
          return id;
        }
      }
    };

    const pickType = (): ShipmentType => {
      let roll = rand();
      for (const [type, weight] of TYPE_WEIGHTS) {
        if ((roll -= weight) <= 0) return type;
      }
      return ShipmentType.DOMESTIC;
    };

    const routeFor = (type: ShipmentType): { pickup: string; delivery: string } => {
      if (type === ShipmentType.EXPORT) return { pickup: pick(NIGERIAN_CITIES), delivery: pick(FOREIGN_CITIES) };
      if (type === ShipmentType.IMPORT) return { pickup: pick(FOREIGN_CITIES), delivery: pick(NIGERIAN_CITIES) };
      const pickup = pick(NIGERIAN_CITIES);
      return { pickup, delivery: pick(NIGERIAN_CITIES.filter((c) => c !== pickup)) };
    };

    const statusFor = (createdAt: Date): { status: ShipmentStatus; paymentStatus: PaymentStatus } => {
      const ageDays = (now.getTime() - createdAt.getTime()) / DAY_MS;
      if (ageDays > 5) {
        const cancelled = rand() < 0.08;
        return cancelled
          ? { status: ShipmentStatus.CANCELLED, paymentStatus: PaymentStatus.UNPAID }
          : { status: ShipmentStatus.DELIVERED, paymentStatus: PaymentStatus.PAID };
      }
      return {
        status: pick(RECENT_STATUSES),
        paymentStatus: rand() < 0.5 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      };
    };

    const buildShipment = (sender: User, createdAt: Date, overrides: Partial<Shipment> = {}): Partial<Shipment> => {
      const type = pickType();
      const route = routeFor(type);
      return {
        trackingId: newTrackingId(),
        senderId: sender.id,
        receiverName: pick(RECEIVERS),
        pickupLocation: route.pickup,
        deliveryLocation: route.delivery,
        type,
        amount: (Math.floor(30 + rand() * 9970) * 50).toFixed(2),
        processingTimeHours: 4 + Math.floor(rand() * 68),
        createdAt,
        ...statusFor(createdAt),
        ...overrides,
      };
    };

    await dataSource.transaction(async (manager) => {
      const saved = new Map<string, User>();
      for (const seedUser of SEED_USERS) {
        const { key, walletBalance, ...profile } = seedUser;
        saved.set(key, await manager.save(User, manager.create(User, { ...profile, passwordHash, isEmailVerified: true })));
        void walletBalance;
      }

      for (const seedUser of SEED_USERS.filter((u) => u.walletBalance)) {
        const user = saved.get(seedUser.key) as User;
        const wallet = await manager.save(Wallet, manager.create(Wallet, { userId: user.id, balance: seedUser.walletBalance }));
        await manager.insert(WalletTransaction, {
          walletId: wallet.id,
          type: WalletTransactionType.CREDIT,
          amount: seedUser.walletBalance,
          reference: `SEED-OPENING-${user.id}`,
          description: 'Seed opening balance',
        });
      }

      const customers = [
        { user: saved.get('user') as User, scale: 1, thisMonth: 34, lastMonth: 18, showcase: true },
        { user: saved.get('user2') as User, scale: 0.6, thisMonth: 20, lastMonth: 12, showcase: false },
      ];
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const rows: Partial<Shipment>[] = [];

      for (const { user, scale, thisMonth, lastMonth, showcase } of customers) {
        for (let m = 0; m <= month; m++) {
          const target = m === month ? thisMonth : m === month - 1 ? lastMonth : Math.round(MONTHLY_TEMPLATE[m] * scale);
          const randomCount = m === month && showcase ? target - SHOWCASE_SHIPMENTS.length : target;
          const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
          const maxDay = m === month ? Math.max(1, now.getUTCDate() - 1) : daysInMonth;

          for (let i = 0; i < randomCount; i++) {
            const day = 1 + Math.floor(rand() * maxDay);
            rows.push(buildShipment(user, new Date(Date.UTC(year, m, day, Math.floor(rand() * 24), Math.floor(rand() * 60)))));
          }
        }

        if (showcase) {
          for (const item of SHOWCASE_SHIPMENTS) {
            rows.push(
              buildShipment(user, new Date(now.getTime() - item.hoursAgo * 3_600_000), {
                trackingId: item.trackingId,
                receiverName: 'Mercy',
                pickupLocation: 'Lagos, Nigeria',
                deliveryLocation: 'Oyo, Nigeria',
                type: ShipmentType.DOMESTIC,
                amount: '3000.00',
                processingTimeHours: 10,
                status: item.status,
                paymentStatus: item.paymentStatus,
              }),
            );
          }
        }
      }

      for (const batch of chunk(rows, 200)) await manager.insert(Shipment, batch);
      console.log(`Seeded ${SEED_USERS.length} users and ${rows.length} shipments.`);
    });
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
