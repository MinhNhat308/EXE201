import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from '../modules/branches/schemas/branch.schema';
import { Ingredient, IngredientSchema } from '../modules/inventory/schemas/ingredient.schema';
import { Recipe, RecipeSchema } from '../modules/inventory/schemas/recipe.schema';
import {
  SupplierReceipt,
  SupplierReceiptSchema,
} from '../modules/inventory/schemas/supplier-receipt.schema';
import {
  WarehouseLocation,
  WarehouseLocationSchema,
} from '../modules/inventory/schemas/warehouse-location.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from '../modules/inventory/schemas/warehouse-stock.schema';
import { MenuItem, MenuItemSchema } from '../modules/menu/schemas/menu-item.schema';
import { Topping, ToppingSchema } from '../modules/toppings/schemas/topping.schema';
import { DemoInventorySeedService } from './demo-inventory.seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ingredient.name, schema: IngredientSchema },
      { name: WarehouseLocation.name, schema: WarehouseLocationSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Topping.name, schema: ToppingSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: SupplierReceipt.name, schema: SupplierReceiptSchema },
    ]),
  ],
  providers: [DemoInventorySeedService],
  exports: [DemoInventorySeedService],
})
export class SeedModule {}
