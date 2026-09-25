import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ANALYTICS_ROLES } from '../common/enums/role-groups';
import { type SessionUser } from '../common/interfaces/session-user.interface';
import { DashboardPeriod, GrowthGranularity } from '../common/utils/date-range.util';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { GrowthQueryDto } from './dto/growth-query.dto';

@ApiTags('dashboard')
@ApiCookieAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiQuery({ name: 'period', required: false, enum: DashboardPeriod, example: DashboardPeriod.THIS_MONTH })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        period: 'this_month',
        range: { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' },
        scope: 'own',
        sections: { wallet: true, growthChart: false, recentShipments: true },
        kpis: { totalShipments: { count: 34, previousCount: 18, changePercent: 88.9 } },
        wallet: { balance: '3000000.28', currency: 'NGN' },
        recentShipments: [],
      },
    },
  })
  overview(@CurrentUser() user: SessionUser, @Query() query: DashboardQueryDto) {
    return this.dashboard.getOverview(user, query.period);
  }

  @Roles(...ANALYTICS_ROLES)
  @Get('growth')
  @ApiQuery({ name: 'granularity', required: false, enum: GrowthGranularity, example: GrowthGranularity.YEAR })
  @ApiResponse({
    status: 200,
    schema: { example: { granularity: 'year', scope: 'all', points: [{ date: '2026-01-01', shipments: 41, revenue: '5231750.00' }] } },
  })
  growth(@CurrentUser() user: SessionUser, @Query() query: GrowthQueryDto) {
    return this.dashboard.getGrowth(user, query.granularity);
  }
}
