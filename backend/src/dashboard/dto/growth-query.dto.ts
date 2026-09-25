import { IsEnum } from 'class-validator';
import { GrowthGranularity } from '../../common/utils/date-range.util';

export class GrowthQueryDto {
  @IsEnum(GrowthGranularity)
  granularity: GrowthGranularity = GrowthGranularity.YEAR;
}
