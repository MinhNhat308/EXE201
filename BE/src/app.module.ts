import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { APP_GUARD } from '@nestjs/core';

import { ConfigModule } from '@nestjs/config';

import { MongooseModule } from '@nestjs/mongoose';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { FeatureGuard } from './common/guards/feature.guard';

import { SubscriptionGuard } from './common/guards/subscription.guard';

import { TenantGuard } from './common/guards/tenant.guard';

import { AuthModule } from './modules/auth/auth.module';

import { BillingModule } from './modules/billing/billing.module';

import { MenuModule } from './modules/menu/menu.module';

import { OrdersModule } from './modules/orders/orders.module';

import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';

import { PublicModule } from './modules/public/public.module';

import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

import { TenantsModule } from './modules/tenants/tenants.module';

import { ToppingsModule } from './modules/toppings/toppings.module';

import { InventoryModule } from './modules/inventory/inventory.module';

import { ShiftsModule } from './modules/shifts/shifts.module';

import { ReportsModule } from './modules/reports/reports.module';

import { UsersModule } from './modules/users/users.module';

import { DemoDataService } from './seed/demo-data.service';

import { DemoInventorySeedService } from './seed/demo-inventory.seed.service';
import { DemoTenantsSeedService } from './seed/demo-tenants.seed.service';
import { DemoStoreReportsSeedService } from './seed/demo-store-reports.seed.service';
import { DemoChainBranchSetupService } from './seed/demo-chain-branch-setup.seed.service';
import { DemoChainOperationsSeedService } from './seed/demo-chain-operations.seed.service';
import { DemoChainReportsSeedService } from './seed/demo-chain-reports.seed.service';

import { SeedService } from './seed/seed.service';

import { TenantMigrationService } from './seed/tenant-migration.service';
import { TenantContextMiddleware } from './common/tenant/tenant-context.middleware';

import { Order, OrderSchema } from './modules/orders/schemas/order.schema';

import { MenuItem, MenuItemSchema } from './modules/menu/schemas/menu-item.schema';

import { User, UserSchema } from './modules/users/schemas/user.schema';

import { BranchesModule } from './modules/branches/branches.module';
import { Branch, BranchSchema } from './modules/branches/schemas/branch.schema';
import { Tenant, TenantSchema } from './modules/tenants/schemas/tenant.schema';

import {
  Subscription,
  SubscriptionSchema,
} from './modules/subscriptions/schemas/subscription.schema';
import { Topping, ToppingSchema } from './modules/toppings/schemas/topping.schema';
import {
  PaymentMethodConfig,
  PaymentMethodSchema,
} from './modules/payment-methods/schemas/payment-method.schema';
import { Ingredient, IngredientSchema } from './modules/inventory/schemas/ingredient.schema';
import { Recipe, RecipeSchema } from './modules/inventory/schemas/recipe.schema';
import {
  WarehouseLocation,
  WarehouseLocationSchema,
} from './modules/inventory/schemas/warehouse-location.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from './modules/inventory/schemas/warehouse-stock.schema';
import {
  StockMovement,
  StockMovementSchema,
} from './modules/inventory/schemas/stock-movement.schema';
import {
  SupplierReceipt,
  SupplierReceiptSchema,
} from './modules/inventory/schemas/supplier-receipt.schema';
import {
  StockTransferRequest,
  StockTransferRequestSchema,
} from './modules/inventory/schemas/stock-transfer-request.schema';
import {
  ShiftSession,
  ShiftSessionSchema,
} from './modules/shifts/schemas/shift-session.schema';
import { StockLot, StockLotSchema } from './modules/inventory/schemas/stock-lot.schema';



@Module({

  imports: [

    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRoot(

      process.env.MONGODB_URI_DIRECT?.trim() ||

        process.env.MONGODB_URI?.trim() ||

        '',

      { serverSelectionTimeoutMS: 20_000 },

    ),

    MongooseModule.forFeature([

      { name: Order.name, schema: OrderSchema },

      { name: User.name, schema: UserSchema },

      { name: MenuItem.name, schema: MenuItemSchema },

      { name: Tenant.name, schema: TenantSchema },
      { name: Branch.name, schema: BranchSchema },

      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Topping.name, schema: ToppingSchema },
      { name: PaymentMethodConfig.name, schema: PaymentMethodSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: WarehouseLocation.name, schema: WarehouseLocationSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: SupplierReceipt.name, schema: SupplierReceiptSchema },
      { name: StockTransferRequest.name, schema: StockTransferRequestSchema },
      { name: ShiftSession.name, schema: ShiftSessionSchema },
      { name: StockLot.name, schema: StockLotSchema },
    ]),

    TenantsModule,

    SubscriptionsModule,

    BillingModule,

    PublicModule,

    AuthModule,

    UsersModule,

    MenuModule,

    ToppingsModule,

    PaymentMethodsModule,

    OrdersModule,

    InventoryModule,

    ShiftsModule,

    ReportsModule,

    BranchesModule,

  ],

  providers: [

    SeedService,

    DemoDataService,

    DemoTenantsSeedService,

    DemoInventorySeedService,

    DemoStoreReportsSeedService,

    DemoChainBranchSetupService,

    DemoChainReportsSeedService,

    DemoChainOperationsSeedService,

    TenantMigrationService,

    { provide: APP_GUARD, useClass: JwtAuthGuard },

    { provide: APP_GUARD, useClass: TenantGuard },

    { provide: APP_GUARD, useClass: SubscriptionGuard },

    { provide: APP_GUARD, useClass: FeatureGuard },

  ],

})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}


