import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GrowthGranularity } from '../../common/utils/date-range.util';

export class GrowthQueryDto {
  @ApiProperty({ enum: GrowthGranularity, example: GrowthGranularity.YEAR, default: GrowthGranularity.YEAR })
  @IsEnum(GrowthGranularity)
  granularity: GrowthGranularity = GrowthGranularity.YEAR;
}
