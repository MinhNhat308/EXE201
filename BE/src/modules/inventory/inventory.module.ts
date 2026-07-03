import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuItem, MenuItemSchema } from '../menu/schemas/menu-item.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Ingredient, IngredientSchema } from './schemas/ingredient.schema';
import { Recipe, RecipeSchema } from './schemas/recipe.schema';
import { StockMovement, StockMovementSchema } from './schemas/stock-movement.schema';
import {
  SupplierReceipt,
  SupplierReceiptSchema,
} from './schemas/supplier-receipt.schema';
import {
  WarehouseLocation,
  WarehouseLocationSchema,
} from './schemas/warehouse-location.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from './schemas/warehouse-stock.schema';
import {
  StockTransferRequest,
  StockTransferRequestSchema,
} from './schemas/stock-transfer-request.schema';
import { StockLot, StockLotSchema } from './schemas/stock-lot.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: SupplierReceipt.name, schema: SupplierReceiptSchema },
      { name: WarehouseLocation.name, schema: WarehouseLocationSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockTransferRequest.name, schema: StockTransferRequestSchema },
      { name: StockLot.name, schema: StockLotSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
