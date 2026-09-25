import { IsEnum } from 'class-validator';
import { DashboardPeriod } from '../../common/utils/date-range.util';

export class DashboardQueryDto {
  @IsEnum(DashboardPeriod)
  period: DashboardPeriod = DashboardPeriod.THIS_MONTH;
}
