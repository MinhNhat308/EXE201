import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { WorkShift } from '../../common/enums/work-shift.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { SaasFeature } from '../../common/enums/saas-feature.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateKitchenStatusDto } from './dto/update-kitchen-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequireFeature(SaasFeature.POS)
  @Roles(Role.STAFF, Role.ADMIN)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.create(createOrderDto, user);
  }

  /** Solo POS — tạo đơn đã hoàn tất (không qua bếp/phục vụ) */
  @Post('solo-sale')
  @RequireFeature(SaasFeature.POS)
  @Roles(Role.ADMIN)
  createSoloSale(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.createSoloSale(createOrderDto, user);
  }

  @Get('reports/today')
  @RequireFeature(SaasFeature.BASIC_REPORTS)
  @Roles(Role.ADMIN, Role.STORE_MANAGER, Role.ACCOUNTING)
  todayReport(@Query('workShift') workShift?: WorkShift) {
    return this.ordersService.getTodayReport(workShift);
  }

  @Get('today')
  @Roles(
    Role.STAFF,
    Role.KITCHEN,
    Role.STORE_MANAGER,
    Role.ACCOUNTING,
    Role.ADMIN,
  )
  findToday(
    @Query('workShift') workShift?: WorkShift,
    @Query('activeOnly') activeOnly?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.ordersService.findToday(
      workShift,
      activeOnly === 'true',
      branchId,
    );
  }

  @Get('active')
  @Roles(Role.STAFF, Role.ADMIN)
  findActive(@Query('workShift') workShift?: WorkShift) {
    if (workShift) {
      return this.ordersService.findByShift(workShift);
    }
    return this.ordersService.findActiveForServer();
  }

  @Get(':id')
  @Roles(
    Role.STAFF,
    Role.KITCHEN,
    Role.STORE_MANAGER,
    Role.ACCOUNTING,
    Role.ADMIN,
  )
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateByCashier(id, dto);
  }

  @Patch(':id/cancel')
  @Roles(Role.STAFF, Role.STORE_MANAGER, Role.ADMIN)
  cancel(@Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.cancel(id, dto);
  }

  @Patch(':id/kitchen-status')
  @RequireFeature(SaasFeature.KITCHEN)
  @Roles(Role.KITCHEN, Role.ADMIN)
  updateKitchenStatus(
    @Param('id') id: string,
    @Body() dto: UpdateKitchenStatusDto,
  ) {
    return this.ordersService.updateKitchenStatus(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
