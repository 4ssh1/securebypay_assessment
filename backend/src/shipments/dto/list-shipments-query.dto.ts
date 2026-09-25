import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaymentStatus, ShipmentStatus, ShipmentType } from '../../common/enums/shipment.enums';

export class ListShipmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @ApiPropertyOptional({ enum: ShipmentStatus, example: ShipmentStatus.IN_TRANSIT })
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.UNPAID })
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @ApiPropertyOptional({ enum: ShipmentType, example: ShipmentType.DOMESTIC })
  @IsEnum(ShipmentType)
  type?: ShipmentType;
}
