import { IsEnum, IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/dto/transforms';
import { ShipmentType } from '../../common/enums/shipment.enums';
import { MONEY_PATTERN } from '../../common/utils/money.util';

export class CreateShipmentDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  receiverName: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  pickupLocation: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  deliveryLocation: string;

  @IsEnum(ShipmentType)
  type: ShipmentType;

  @IsString()
  @Matches(MONEY_PATTERN, { message: 'amount must be a positive decimal with at most 2 decimal places' })
  amount: string;

  @IsInt()
  @Min(1)
  @Max(240)
  processingTimeHours: number;
}
