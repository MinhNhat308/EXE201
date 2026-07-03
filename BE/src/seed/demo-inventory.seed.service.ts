import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { defaultUnitForCategory } from '../common/enums/ingredient-category.enum';
import { Ingredient, IngredientDocument } from '../modules/inventory/schemas/ingredient.schema';
import { Recipe, RecipeDocument } from '../modules/inventory/schemas/recipe.schema';
import {
  SupplierReceipt,
  SupplierReceiptDocument,
} from '../modules/inventory/schemas/supplier-receipt.schema';
import {
  WarehouseLocation,
  WarehouseLocationDocument,
} from '../modules/inventory/schemas/warehouse-location.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../modules/inventory/schemas/warehouse-stock.schema';
import { MenuItem, MenuItemDocument } from '../modules/menu/schemas/menu-item.schema';
import { Topping, ToppingDocument } from '../modules/toppings/schemas/topping.schema';
import { getDemoInventoryPack, isKnownDemoSlug } from './demo-inventory.packs';
import type { DemoInventoryPack } from './demo-inventory.types';

const NO_TOPPING_CATEGORIES = ['Cà phê'];

@Injectable()
export class DemoInventorySeedService {
  private readonly logger = new Logger(DemoInventorySeedService.name);

  constructor(
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuModel: Model<MenuItemDocument>,
    @InjectModel(Topping.name)
    private readonly toppingModel: Model<ToppingDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(SupplierReceipt.name)
    private readonly receiptModel: Model<SupplierReceiptDocument>,
  ) {}

  /** Bổ sung / cập nhật kho, NVL, menu, công thức cho tenant demo */
  async enrichTenant(tenantId: string, slug?: string): Promise<void> {
    const tid = new Types.ObjectId(tenantId);
    const pack = getDemoInventoryPack(slug);
    const warehouses = await this.warehouseModel.find({ tenantId: tid }).exec();
    if (warehouses.length === 0) {
      this.logger.warn(`Tenant ${slug ?? tenantId} chưa có kho — bỏ qua enrich`);
      return;
    }

    const whByCode = Object.fromEntries(warehouses.map((w) => [w.code, w]));
    const ingMap = await this.upsertIngredients(tid, pack);
    await this.reconcileLegacyStockRows(tid, whByCode, ingMap, pack);
    await this.upsertStocks(tid, whByCode, ingMap, pack);
    await this.syncAllIngredientTotals(tid, ingMap, whByCode.KHO1?._id);
    await this.upsertToppings(tid, pack);
    await this.upsertMenu(tid, pack);
    await this.pruneDemoCatalog(tid, slug, pack);
    await this.upsertRecipes(tid, ingMap, pack);
    await this.upsertSupplierReceipt(tid, whByCode, ingMap, pack);

    const [menuActive, recipeCount, stockCount, toppingActive] = await Promise.all([
      this.menuModel.countDocuments({ tenantId: tid, isAvailable: true }).exec(),
      this.recipeModel.countDocuments({ tenantId: tid }).exec(),
      this.stockModel.countDocuments({ tenantId: tid }).exec(),
      this.toppingModel.countDocuments({ tenantId: tid, isActive: true }).exec(),
    ]);

    this.logger.log(
      `Đã enrich DB cho ${slug ?? tenantId}: ${menuActive} món active, ${toppingActive} topping, ${recipeCount} công thức, ${stockCount} dòng tồn kho`,
    );
  }

  /** Ẩn menu/topping không thuộc catalog của segment demo */
  private async pruneDemoCatalog(
    tid: Types.ObjectId,
    slug: string | undefined,
    pack: DemoInventoryPack,
  ) {
    if (!isKnownDemoSlug(slug)) return;

    const menuNames = pack.menuItems.map((m) => m.name);
    const toppingNames = pack.toppings.map((t) => t.name);

    const menuResult = await this.menuModel
      .updateMany(
        { tenantId: tid, name: { $nin: menuNames } },
        { $set: { isAvailable: false } },
      )
      .exec();
    const toppingResult = await this.toppingModel
      .updateMany(
        { tenantId: tid, name: { $nin: toppingNames } },
        { $set: { isActive: false } },
      )
      .exec();

    if (menuResult.modifiedCount > 0 || toppingResult.modifiedCount > 0) {
      this.logger.log(
        `Đã ẩn catalog cũ (${slug}): ${menuResult.modifiedCount} món, ${toppingResult.modifiedCount} topping`,
      );
    }
  }

  private async reconcileLegacyStockRows(
    tid: Types.ObjectId,
    whByCode: Record<string, WarehouseLocationDocument>,
    ingMap: Map<string, Types.ObjectId>,
    pack: DemoInventoryPack,
  ) {
    const whIds = Object.values(whByCode).map((w) => w._id);

    await this.stockModel
      .deleteMany({
        warehouseId: { $in: whIds },
        $or: [{ tenantId: { $exists: false } }, { tenantId: null }],
      })
      .exec();

    for (const lines of Object.values(pack.stockByWarehouse)) {
      for (const line of lines) {
        const ingId = ingMap.get(line.ingredient);
        if (!ingId) continue;
        for (const wh of Object.values(whByCode)) {
          const legacy = await this.stockModel
            .findOne({
              warehouseId: wh._id,
              ingredientId: ingId,
              tenantId: { $ne: tid },
            })
            .exec();
          if (legacy && !legacy.tenantId) {
            await legacy.deleteOne();
          }
        }
      }
    }
  }

  private async upsertIngredients(tid: Types.ObjectId, pack: DemoInventoryPack) {
    const map = new Map<string, Types.ObjectId>();
    for (const item of pack.ingredients) {
      const doc = await this.ingredientModel
        .findOneAndUpdate(
          { tenantId: tid, name: item.name },
          {
            $set: {
              category: item.category,
              unit: defaultUnitForCategory(item.category),
              sku: item.sku,
              ...(item.shelfLifeDays != null
                ? { shelfLifeDays: item.shelfLifeDays }
                : {}),
            },
            $setOnInsert: {
              tenantId: tid,
              name: item.name,
              currentStock: 0,
              minStock: 0,
            },
          },
          { upsert: true, new: true },
        )
        .exec();
      if (doc) map.set(item.name, doc._id);
    }
    return map;
  }

  private async upsertStocks(
    tid: Types.ObjectId,
    whByCode: Record<string, WarehouseLocationDocument>,
    ingMap: Map<string, Types.ObjectId>,
    pack: DemoInventoryPack,
  ) {
    for (const [code, lines] of Object.entries(pack.stockByWarehouse)) {
      const wh = whByCode[code];
      if (!wh) continue;
      for (const line of lines) {
        const ingId = ingMap.get(line.ingredient);
        if (!ingId) continue;
        await this.stockModel
          .findOneAndUpdate(
            { tenantId: tid, warehouseId: wh._id, ingredientId: ingId },
            {
              $set: {
                currentStock: line.currentStock,
                minStock: line.minStock,
              },
              $setOnInsert: {
                tenantId: tid,
                warehouseId: wh._id,
                ingredientId: ingId,
              },
            },
            { upsert: true, new: true },
          )
          .exec();
      }
    }
  }

  private async syncAllIngredientTotals(
    tid: Types.ObjectId,
    ingMap: Map<string, Types.ObjectId>,
    kho1Id?: Types.ObjectId,
  ) {
    for (const ingId of ingMap.values()) {
      const rows = await this.stockModel
        .find({ tenantId: tid, ingredientId: ingId })
        .exec();
      const total = rows.reduce((s, r) => s + r.currentStock, 0);
      const kho1Row = kho1Id
        ? rows.find((r) => r.warehouseId.equals(kho1Id))
        : undefined;
      const minStock =
        kho1Row?.minStock ??
        rows.reduce((m, r) => Math.max(m, r.minStock), 0);
      await this.ingredientModel
        .updateOne({ _id: ingId }, { $set: { currentStock: total, minStock } })
        .exec();
    }
  }

  private async upsertToppings(tid: Types.ObjectId, pack: DemoInventoryPack) {
    for (const t of pack.toppings) {
      await this.toppingModel
        .findOneAndUpdate(
          { tenantId: tid, name: t.name },
          {
            $set: { price: t.price, sortOrder: t.sortOrder, isActive: true },
            $setOnInsert: { tenantId: tid, name: t.name },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  private async upsertMenu(tid: Types.ObjectId, pack: DemoInventoryPack) {
    const toppings = await this.toppingModel
      .find({ tenantId: tid, isActive: true })
      .exec();
    const allTopIds = toppings.map((t) => t._id);

    for (const m of pack.menuItems) {
      const toppingIds = NO_TOPPING_CATEGORIES.includes(m.category)
        ? []
        : allTopIds;
      await this.menuModel
        .findOneAndUpdate(
          { tenantId: tid, name: m.name },
          {
            $set: {
              category: m.category,
              price: m.price,
              description: m.description,
              imageUrl: m.imageUrl,
              isAvailable: true,
              toppingIds,
            },
            $setOnInsert: {
              tenantId: tid,
              name: m.name,
              toppings: [],
            },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  private async upsertRecipes(
    tid: Types.ObjectId,
    ingMap: Map<string, Types.ObjectId>,
    pack: DemoInventoryPack,
  ) {
    for (const r of pack.recipes) {
      const menu = await this.menuModel
        .findOne({ tenantId: tid, name: r.menuName })
        .exec();
      if (!menu) continue;

      const lines = r.lines
        .map((l) => {
          const ingredientId = ingMap.get(l.ingredient);
          if (!ingredientId) return null;
          return { ingredientId, quantity: l.quantity };
        })
        .filter(Boolean) as { ingredientId: Types.ObjectId; quantity: number }[];

      if (lines.length === 0) continue;

      await this.recipeModel
        .findOneAndUpdate(
          { tenantId: tid, menuItemId: menu._id },
          {
            $set: {
              lines,
              intensityPercent: 80,
              sugarPercent: 80,
              icePercent: 80,
            },
            $setOnInsert: { tenantId: tid, menuItemId: menu._id },
          },
          { upsert: true },
        )
        .exec();
    }

    const recipeNames = new Set(pack.recipes.map((r) => r.menuName));
    const allMenus = await this.menuModel
      .find({ tenantId: tid, isAvailable: true })
      .exec();
    for (const menu of allMenus) {
      if (recipeNames.has(menu.name)) continue;
      const exists = await this.recipeModel
        .findOne({ tenantId: tid, menuItemId: menu._id })
        .exec();
      if (exists?.lines?.length) continue;

      const lines: { ingredientId: Types.ObjectId; quantity: number }[] = [];
      const add = (name: string, qty: number) => {
        const id = ingMap.get(name);
        if (id && qty > 0) lines.push({ ingredientId: id, quantity: qty });
      };
      add('Nước trà đen (pha sẵn)', 200);
      add('Sữa tươi', 120);
      add('Đường', 15);
      add('Đá viên', 130);

      const tea = ingMap.get('Nước trà đen (pha sẵn)');
      if (lines.length === 0 && tea) lines.push({ ingredientId: tea, quantity: 200 });

      await this.recipeModel
        .findOneAndUpdate(
          { tenantId: tid, menuItemId: menu._id },
          {
            $set: { lines, intensityPercent: 80, sugarPercent: 80, icePercent: 80 },
            $setOnInsert: { tenantId: tid, menuItemId: menu._id },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  private async upsertSupplierReceipt(
    tid: Types.ObjectId,
    whByCode: Record<string, WarehouseLocationDocument>,
    ingMap: Map<string, Types.ObjectId>,
    pack: DemoInventoryPack,
  ) {
    const receipt = pack.supplierReceipt;
    const exists = await this.receiptModel
      .countDocuments({
        tenantId: tid,
        documentNumber: receipt.documentNumber,
      })
      .exec();
    if (exists > 0) return;

    const wh = whByCode[receipt.warehouseCode];
    if (!wh) return;

    const lines = receipt.lines
      .map((l) => {
        const ingredientId = ingMap.get(l.ingredient);
        if (!ingredientId) return null;
        return {
          ingredientId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        };
      })
      .filter(Boolean) as {
      ingredientId: Types.ObjectId;
      quantity: number;
      unitPrice: number;
    }[];

    if (lines.length === 0) return;

    const docDate = new Date();
    docDate.setDate(docDate.getDate() - 5);

    await this.receiptModel.create({
      tenantId: tid,
      supplierName: receipt.supplierName,
      documentNumber: receipt.documentNumber,
      warehouseId: wh._id,
      warehouseCode: wh.code,
      warehouseName: wh.name,
      documentDate: docDate,
      note: receipt.note,
      lines,
      createdByName: 'Hệ thống (demo)',
    });
  }
}
