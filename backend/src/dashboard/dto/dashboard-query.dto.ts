import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DashboardPeriod } from '../../common/utils/date-range.util';

export class DashboardQueryDto {
  @ApiProperty({ enum: DashboardPeriod, example: DashboardPeriod.THIS_MONTH, default: DashboardPeriod.THIS_MONTH })
  @IsEnum(DashboardPeriod)
  period: DashboardPeriod = DashboardPeriod.THIS_MONTH;
}
