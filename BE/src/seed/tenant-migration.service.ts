import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessModel } from '../common/enums/business-model.enum';
import { SubscriptionPlan } from '../common/enums/subscription-plan.enum';
import { TenantStatus } from '../common/enums/tenant-status.enum';
import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';
import { MenuItem, MenuItemDocument } from '../modules/menu/schemas/menu-item.schema';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { Topping, ToppingDocument } from '../modules/toppings/schemas/topping.schema';
import {
  PaymentMethodConfig,
  PaymentMethodDocument,
} from '../modules/payment-methods/schemas/payment-method.schema';
import { Ingredient, IngredientDocument } from '../modules/inventory/schemas/ingredient.schema';
import { Recipe, RecipeDocument } from '../modules/inventory/schemas/recipe.schema';
import {
  WarehouseLocation,
  WarehouseLocationDocument,
} from '../modules/inventory/schemas/warehouse-location.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../modules/inventory/schemas/warehouse-stock.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../modules/inventory/schemas/stock-movement.schema';
import {
  SupplierReceipt,
  SupplierReceiptDocument,
} from '../modules/inventory/schemas/supplier-receipt.schema';
import {
  StockTransferRequest,
  StockTransferRequestDocument,
} from '../modules/inventory/schemas/stock-transfer-request.schema';
import { Tenant, TenantDocument } from '../modules/tenants/schemas/tenant.schema';
import { SubscriptionsService } from '../modules/subscriptions/subscriptions.service';

@Injectable()
export class TenantMigrationService implements OnModuleInit {
  private readonly logger = new Logger(TenantMigrationService.name);

  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name) private readonly menuModel: Model<MenuItemDocument>,
    @InjectModel(Topping.name) private readonly toppingModel: Model<ToppingDocument>,
    @InjectModel(PaymentMethodConfig.name)
    private readonly paymentModel: Model<PaymentMethodDocument>,
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(Recipe.name) private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly warehouseStockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(SupplierReceipt.name)
    private readonly receiptModel: Model<SupplierReceiptDocument>,
    @InjectModel(StockTransferRequest.name)
    private readonly stockRequestModel: Model<StockTransferRequestDocument>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureDefaultTenantAndBackfill();
    } catch (err) {
      this.logger.warn(
        `Migration/backfill bỏ qua lỗi index: ${(err as Error).message}`,
      );
    }
  }

  /** Xóa index single-field cũ (trước multi-tenant) để tránh E11000 khi seed tenant mới */
  private async dropLegacyIndexes() {
    const drops: Array<{ model: Model<unknown>; names: string[] }> = [
      { model: this.warehouseModel, names: ['code_1'] },
      { model: this.ingredientModel, names: ['name_1'] },
      { model: this.paymentModel, names: ['code_1'] },
      { model: this.orderModel, names: ['orderNumber_1', 'invoiceNumber_1'] },
      { model: this.stockRequestModel, names: ['requestNumber_1'] },
      { model: this.warehouseStockModel, names: ['warehouseId_1_ingredientId_1'] },
    ];

    for (const { model, names } of drops) {
      for (const name of names) {
        try {
          await model.collection.dropIndex(name);
          this.logger.log(`Dropped legacy index ${name}`);
        } catch {
          /* không tồn tại */
        }
      }
      try {
        await model.syncIndexes();
      } catch {
        /* sync lỗi — bỏ qua để không chặn khởi động */
      }
    }
  }

  async ensureDefaultTenantAndBackfill() {
    await this.dropLegacyIndexes();
    let tenant = await this.tenantModel.findOne({ slug: 'teaflow-legacy' }).exec();

    if (!tenant) {
      const now = new Date();
      const subEnd = new Date(now);
      subEnd.setFullYear(subEnd.getFullYear() + 10);

      tenant = await new this.tenantModel({
        storeName: 'TeaFlow Legacy Store',
        slug: 'teaflow-legacy',
        businessModel: BusinessModel.SMALL,
        packageType: SubscriptionPlan.PREMIUM,
        status: TenantStatus.ACTIVE,
        subscriptionExpiredAt: subEnd,
      }).save();

      await this.subscriptionsService.createLegacyActiveSubscription(
        tenant._id.toString(),
        SubscriptionPlan.PREMIUM,
      );

      this.logger.log(`Đã tạo default tenant: ${tenant._id}`);
    }

    const tenantId = tenant._id;

    try {
      await this.userModel.collection.dropIndex('tenantId_1_username_1');
    } catch {
      /* index chưa tồn tại hoặc đã đúng kiểu */
    }
    try {
      await this.userModel.syncIndexes();
    } catch (err) {
      this.logger.warn(
        `syncIndexes users bỏ qua: ${(err as Error).message}`,
      );
    }

    await this.userModel
      .updateMany(
        { $or: [{ username: null }, { username: '' }] },
        { $unset: { username: '' } },
      )
      .exec();

    const models: Model<{ tenantId?: unknown }>[] = [
      this.userModel,
      this.orderModel,
      this.menuModel,
      this.toppingModel,
      this.paymentModel,
      this.ingredientModel,
      this.recipeModel,
      this.warehouseModel,
      this.warehouseStockModel,
      this.movementModel,
      this.receiptModel,
      this.stockRequestModel,
    ];

    for (const m of models) {
      const res = await m.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId } },
      );
      if (res.modifiedCount > 0) {
        this.logger.log(`Backfill tenantId: ${res.modifiedCount} docs`);
      }
    }

    process.env.DEFAULT_TENANT_ID = tenantId.toString();
  }
}
