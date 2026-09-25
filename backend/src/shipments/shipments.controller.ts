import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Resource } from '../auth/decorators/resource.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
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
  list(@CurrentUser() user: SessionUser, @Query() query: ListShipmentsQueryDto) {
    return this.shipments.list(user, query);
  }

  @Roles(Role.USER)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateShipmentDto) {
    return this.shipments.create(user, dto);
  }

  @CheckPolicy(ShipmentReadHandler)
  @Get(':id')
  findOne(@Resource() shipment: Shipment) {
    return ShipmentResponseDto.from(shipment);
  }

  @Roles(Role.USER)
  @CheckPolicy(ShipmentPayHandler)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':id/pay')
  pay(@Resource() shipment: Shipment, @CurrentUser() user: SessionUser) {
    return this.shipments.pay(shipment, user);
  }
}
