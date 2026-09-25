import { Injectable } from '@nestjs/common';
import { ANALYTICS_ROLES, WALLET_ROLES } from '../common/enums/role-groups';
import { SessionUser } from '../common/interfaces/session-user.interface';
import {
  DashboardPeriod,
  GrowthGranularity,
  resolveGrowthWindow,
  resolvePeriod,
} from '../common/utils/date-range.util';
import { GrowthPoint, RECENT_SHIPMENTS_LIMIT, ShipmentsService } from '../shipments/shipments.service';
import { DataScope, ShipmentPolicy } from '../shipments/policies/shipment.policy';
import { WalletService, WalletSummary } from '../wallet/wallet.service';
import { buildKpi, KpiMetric } from './kpi.util';
import { ShipmentResponseDto } from '../shipments/dto/shipment-response.dto';

export interface DashboardOverview {
  period: DashboardPeriod;
  range: { from: string; to: string };
  scope: DataScope;
  sections: { wallet: boolean; growthChart: boolean; recentShipments: boolean };
  kpis: { totalShipments: KpiMetric; totalExports: KpiMetric; totalImports: KpiMetric };
  wallet: WalletSummary | null;
  recentShipments: ShipmentResponseDto[];
}

export interface GrowthChart {
  granularity: GrowthGranularity;
  scope: DataScope;
  points: GrowthPoint[];
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly shipments: ShipmentsService,
    private readonly policy: ShipmentPolicy,
    private readonly wallet: WalletService,
  ) {}

  async getOverview(user: SessionUser, period: DashboardPeriod): Promise<DashboardOverview> {
    const { current, previous } = resolvePeriod(period);
    const showWallet = WALLET_ROLES.includes(user.role);

    const [now, before, wallet, recentShipments] = await Promise.all([
      this.shipments.countByType(user, current),
      this.shipments.countByType(user, previous),
      showWallet ? this.wallet.getSummary(user.id) : Promise.resolve(null),
      this.shipments.recent(user, RECENT_SHIPMENTS_LIMIT),
    ]);

    return {
      period,
      range: { from: current.from.toISOString(), to: current.to.toISOString() },
      scope: this.policy.scopeOf(user),
      sections: { wallet: showWallet, growthChart: ANALYTICS_ROLES.includes(user.role), recentShipments: true },
      kpis: {
        totalShipments: buildKpi(now.total, before.total),
        totalExports: buildKpi(now.exports, before.exports),
        totalImports: buildKpi(now.imports, before.imports),
      },
      wallet,
      recentShipments,
    };
  }

  async getGrowth(user: SessionUser, granularity: GrowthGranularity): Promise<GrowthChart> {
    const points = await this.shipments.growthSeries(user, resolveGrowthWindow(granularity));
    return { granularity, scope: this.policy.scopeOf(user), points };
  }
}
