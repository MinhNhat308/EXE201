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
import { ReturnClosureStatus } from '../../common/enums/return-closure-status.enum';
import { StockRequestStatus } from '../../common/enums/stock-request-status.enum';
import { StockRequestType } from '../../common/enums/stock-request-type.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { SaasFeature } from '../../common/enums/saas-feature.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { CreateStockRequestDto } from './dto/create-stock-request.dto';
import { CreateSupplierReceiptDto } from './dto/create-supplier-receipt.dto';
import { ReviewStockRequestDto } from './dto/review-stock-request.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UpdateWarehouseStockDto } from './dto/update-warehouse-stock.dto';
import { UpsertRecipeDto } from './dto/upsert-recipe.dto';
import { UpdateSoloRecipeDto } from './dto/update-solo-recipe.dto';
import { InventoryService } from './inventory.service';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('warehouses')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  findWarehouses(
    @Query('all') all?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findWarehouses(all === 'true', branchId);
  }

  @Patch('warehouses/:id')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.ADMIN)
  updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.inventoryService.updateWarehouse(id, dto);
  }

  @Patch('warehouses/:warehouseId/stocks/:ingredientId')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.ADMIN)
  updateWarehouseStock(
    @Param('warehouseId') warehouseId: string,
    @Param('ingredientId') ingredientId: string,
    @Body() dto: UpdateWarehouseStockDto,
  ) {
    return this.inventoryService.updateWarehouseStock(
      warehouseId,
      ingredientId,
      dto,
    );
  }

  @Get('warehouses/central')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  getCentralWarehouse() {
    return this.inventoryService.findWarehouses().then((list) =>
      list.find((w) => w.isCentralWarehouse),
    );
  }

  @Get('stock')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  getStock(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getStockDashboard(warehouseId);
  }

  @Get('overview')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  getOverview(
    @Query('warehouseId') warehouseId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.getWarehouseOverview(warehouseId, branchId);
  }

  @Get('usage/daily')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  getDailyUsage(
    @Query('date') date: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const d = date ?? new Date().toISOString().slice(0, 10);
    return this.inventoryService.getDailyUsage(d, warehouseId);
  }

  @Get('pos-alerts')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.STAFF, Role.ADMIN, Role.STORE_MANAGER, Role.KITCHEN)
  getPosAlerts() {
    return this.inventoryService.getPosStockAlerts();
  }

  @Get('ledger')
  @RequireFeature(SaasFeature.ACCOUNTING)
  @Roles(Role.ACCOUNTING, Role.ADMIN)
  getLedger(@Query('month') month: string, @Query('branchId') branchId?: string) {
    const m =
      month ?? new Date().toISOString().slice(0, 7);
    return this.inventoryService.getDocumentLedger(m, branchId);
  }

  @Get('ingredients')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  findIngredients() {
    return this.inventoryService.findAllIngredients();
  }

  @Post('ingredients')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.ADMIN)
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Patch('ingredients/:id')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.ADMIN)
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Get('recipes')
  @RequireFeature(SaasFeature.RECIPE)
  @Roles(Role.ADMIN)
  findRecipes() {
    return this.inventoryService.findRecipes();
  }

  @Post('recipes')
  @RequireFeature(SaasFeature.RECIPE)
  @Roles(Role.ADMIN)
  upsertRecipe(@Body() dto: UpsertRecipeDto) {
    return this.inventoryService.upsertRecipe(dto);
  }

  @Patch('recipes/:menuItemId/solo')
  @RequireFeature(SaasFeature.RECIPE)
  @Roles(Role.ADMIN)
  updateSoloRecipe(
    @Param('menuItemId') menuItemId: string,
    @Body() dto: UpdateSoloRecipeDto,
  ) {
    return this.inventoryService.updateSoloRecipe(menuItemId, dto);
  }

  @Get('supplier-receipts')
  @RequireFeature(SaasFeature.ACCOUNTING)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  findReceipts(@Query('branchId') branchId?: string) {
    return this.inventoryService.findSupplierReceipts(branchId);
  }

  @Post('supplier-receipts')
  @RequireFeature(SaasFeature.ACCOUNTING)
  @Roles(Role.ACCOUNTING, Role.ADMIN)
  createReceipt(
    @Body() dto: CreateSupplierReceiptDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inventoryService.createSupplierReceipt(dto, user);
  }

  @Get('expiry-alerts')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  getExpiryAlerts(
    @Query('withinDays') withinDays?: string,
    @Query('branchId') branchId?: string,
  ) {
    const days = withinDays ? Number(withinDays) : 7;
    return this.inventoryService.getExpiryAlerts(
      Number.isFinite(days) ? days : 7,
      branchId,
    );
  }

  @Get('operations-dashboard')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  getOperationsDashboard(@Query('branchId') branchId?: string) {
    return this.inventoryService.getOperationsDashboard(branchId);
  }

  @Get('stock-requests/open-dispatch')
  @RequireFeature(SaasFeature.SHIFT_MGMT)
  @Roles(Role.STORE_MANAGER, Role.ADMIN)
  findOpenDispatch(
    @Query('warehouseId') warehouseId: string,
    @Query('businessDate') businessDate?: string,
  ) {
    return this.inventoryService.findOpenDispatchForReturn(
      warehouseId,
      businessDate,
    );
  }

  @Get('stock-requests')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN, Role.ACCOUNTING)
  findStockRequests(
    @Query('status') status?: StockRequestStatus,
    @Query('type') type?: StockRequestType,
    @Query('businessDate') businessDate?: string,
    @Query('returnClosureStatus') returnClosureStatus?: ReturnClosureStatus,
    @Query('parentRequestId') parentRequestId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findStockRequests({
      status,
      type,
      businessDate,
      returnClosureStatus,
      parentRequestId,
      branchId,
    });
  }

  @Post('stock-requests')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.STORE_MANAGER, Role.ADMIN)
  createStockRequest(
    @Body() dto: CreateStockRequestDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inventoryService.createStockRequest(dto, user);
  }

  @Patch('stock-requests/:id/review')
  @RequireFeature(SaasFeature.ACCOUNTING)
  @Roles(Role.ACCOUNTING, Role.ADMIN)
  reviewStockRequest(
    @Param('id') id: string,
    @Body() dto: ReviewStockRequestDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inventoryService.reviewStockRequest(id, dto, user);
  }

  /** @deprecated Dùng stock-requests */
  @Post('transfer')
  @RequireFeature(SaasFeature.WAREHOUSE)
  @Roles(Role.WAREHOUSE, Role.ADMIN, Role.ACCOUNTING)
  transferStock(@Body() dto: TransferStockDto) {
    return this.inventoryService.transferStock(dto);
  }
}
