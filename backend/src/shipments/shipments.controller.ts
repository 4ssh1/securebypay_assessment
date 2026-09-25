import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Resource } from '../auth/decorators/resource.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaymentStatus, ShipmentStatus, ShipmentType } from '../common/enums/shipment.enums';
import { type SessionUser } from '../common/interfaces/session-user.interface';
import { Shipment } from '../entities';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ShipmentPayHandler, ShipmentReadHandler } from './policies/shipment-access.handlers';
import { ShipmentsService } from './shipments.service';

@ApiTags('shipments')
@ApiCookieAuth()
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, minimum: 1, description: 'Page number.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, minimum: 1, maximum: 50, description: 'Items per page.' })
  @ApiQuery({ name: 'status', required: false, enum: ShipmentStatus, example: ShipmentStatus.IN_TRANSIT })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus, example: PaymentStatus.UNPAID })
  @ApiQuery({ name: 'type', required: false, enum: ShipmentType, example: ShipmentType.DOMESTIC })
  @ApiResponse({ status: 200, description: 'Paginated shipments.', schema: { example: { success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } } })
  list(@CurrentUser() user: SessionUser, @Query() query: ListShipmentsQueryDto) {
    return this.shipments.list(user, query);
  }

  @Roles(Role.USER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, type: ShipmentResponseDto })
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateShipmentDto) {
    return this.shipments.create(user, dto);
  }

  @CheckPolicy(ShipmentReadHandler)
  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid', example: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  findOne(@Resource() shipment: Shipment) {
    return ShipmentResponseDto.from(shipment);
  }

  @Roles(Role.USER)
  @CheckPolicy(ShipmentPayHandler)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':id/pay')
  @ApiParam({ name: 'id', type: String, format: 'uuid', example: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b' })
  @ApiResponse({ status: 200, schema: { example: { shipment: { trackingId: 'MAF-100-234-291', paymentStatus: 'paid' }, walletBalance: '2997000.28' } } })
  pay(@Resource() shipment: Shipment, @CurrentUser() user: SessionUser) {
    return this.shipments.pay(shipment, user);
  }
}
