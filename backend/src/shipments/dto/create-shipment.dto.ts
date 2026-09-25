import { IsEnum, IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../common/dto/transforms';
import { ShipmentType } from '../../common/enums/shipment.enums';
import { MONEY_PATTERN } from '../../common/utils/money.util';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Mercy', minLength: 1, maxLength: 120 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  receiverName: string;

  @ApiProperty({ example: 'Lagos, Nigeria', minLength: 1, maxLength: 160 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  pickupLocation: string;

  @ApiProperty({ example: 'Oyo, Nigeria', minLength: 1, maxLength: 160 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  deliveryLocation: string;

  @ApiProperty({ enum: ShipmentType, example: ShipmentType.DOMESTIC })
  @IsEnum(ShipmentType)
  type: ShipmentType;

  @ApiProperty({ example: '3000.00', pattern: '^\\d+(\\.\\d{1,2})?$' })
  @IsString()
  @Matches(MONEY_PATTERN, { message: 'amount must be a positive decimal with at most 2 decimal places' })
  amount: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 240 })
  @IsInt()
  @Min(1)
  @Max(240)
  processingTimeHours: number;
}
