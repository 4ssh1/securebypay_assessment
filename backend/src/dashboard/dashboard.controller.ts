import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ANALYTICS_ROLES } from '../common/enums/role-groups';
import { type SessionUser } from '../common/interfaces/session-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { GrowthQueryDto } from './dto/growth-query.dto';

@ApiTags('dashboard')
@ApiCookieAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(@CurrentUser() user: SessionUser, @Query() query: DashboardQueryDto) {
    return this.dashboard.getOverview(user, query.period);
  }

  @Roles(...ANALYTICS_ROLES)
  @Get('growth')
  growth(@CurrentUser() user: SessionUser, @Query() query: GrowthQueryDto) {
    return this.dashboard.getGrowth(user, query.granularity);
  }
}
