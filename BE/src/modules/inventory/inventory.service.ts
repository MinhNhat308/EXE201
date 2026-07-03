import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  IngredientCategory,
  defaultUnitForCategory,
} from '../../common/enums/ingredient-category.enum';
import { StockMovementType, STOCK_MOVEMENT_LABELS } from '../../common/enums/stock-movement-type.enum';
import { OrderStatus, normalizeOrderStatus } from '../../common/enums/order-status.enum';
import { MenuItem, MenuItemDocument } from '../menu/schemas/menu-item.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { CreateSupplierReceiptDto } from './dto/create-supplier-receipt.dto';
import { ReturnClosureStatus } from '../../common/enums/return-closure-status.enum';
import { StockRequestStatus } from '../../common/enums/stock-request-status.enum';
import { StockRequestType } from '../../common/enums/stock-request-type.enum';
import { CreateStockRequestDto } from './dto/create-stock-request.dto';
import { ReviewStockRequestDto } from './dto/review-stock-request.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UpdateWarehouseStockDto } from './dto/update-warehouse-stock.dto';
import { UpsertRecipeDto } from './dto/upsert-recipe.dto';
import { Ingredient, IngredientDocument } from './schemas/ingredient.schema';
import { Recipe, RecipeDocument } from './schemas/recipe.schema';
import {
  StockMovement,
  StockMovementDocument,
} from './schemas/stock-movement.schema';
import {
  SupplierReceipt,
  SupplierReceiptDocument,
} from './schemas/supplier-receipt.schema';
import {
  WarehouseLocation,
  WarehouseLocationDocument,
} from './schemas/warehouse-location.schema';
import {
  StockTransferRequest,
  StockTransferRequestDocument,
} from './schemas/stock-transfer-request.schema';
import { StockLot, StockLotDocument } from './schemas/stock-lot.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from './schemas/warehouse-stock.schema';
import { Role } from '../../common/enums/role.enum';
import { User, UserDocument } from '../users/schemas/user.schema';

const DEFAULT_WAREHOUSES = [
  {
    code: 'KHO_TONG',
    name: 'Kho tổng',
    description: 'Kế toán nhập NCC — nguồn xuất cho các kho con',
    sortOrder: 0,
    isKitchenSource: false,
    isCentralWarehouse: true,
  },
  {
    code: 'KHO1',
    name: 'Kho 1 — Quầy / Bếp',
    description: 'Xuất nguyên liệu khi bếp hoàn thành đơn',
    sortOrder: 1,
    isKitchenSource: true,
    isCentralWarehouse: false,
  },
  {
    code: 'KHO2',
    name: 'Kho 2 — Kho khô',
    description: 'Kho con — nhận hàng qua phiếu xin nhập đã duyệt',
    sortOrder: 2,
    isKitchenSource: false,
    isCentralWarehouse: false,
  },
  {
    code: 'KHO3',
    name: 'Kho 3 — Kho lạnh',
    description: 'Kho con — nhận hàng qua phiếu xin nhập đã duyệt',
    sortOrder: 3,
    isKitchenSource: false,
    isCentralWarehouse: false,
  },
];

const DEFAULT_INGREDIENTS: CreateIngredientDto[] = [
  {
    name: 'Nước trà đen (pha sẵn)',
    category: IngredientCategory.LIQUID,
    currentStock: 200_000,
    minStock: 20_000,
  },
  {
    name: 'Sữa tươi',
    category: IngredientCategory.LIQUID,
    currentStock: 80_000,
    minStock: 10_000,
  },
  {
    name: 'Nước lọc',
    category: IngredientCategory.LIQUID,
    currentStock: 150_000,
    minStock: 15_000,
  },
  {
    name: 'Đường',
    category: IngredientCategory.DRY,
    currentStock: 30_000,
    minStock: 3_000,
  },
  {
    name: 'Trân châu đen',
    category: IngredientCategory.TOPPING,
    currentStock: 20_000,
    minStock: 2_000,
  },
  {
    name: 'Bột matcha',
    category: IngredientCategory.DRY,
    currentStock: 5_000,
    minStock: 500,
  },
  {
    name: 'Kem cheese',
    category: IngredientCategory.DRY,
    currentStock: 8_000,
    minStock: 800,
  },
  {
    name: 'Đá viên',
    category: IngredientCategory.DRY,
    currentStock: 100_000,
    minStock: 10_000,
  },
];

function formatDisplayStock(value: number, unit: string, category: IngredientCategory) {
  if (category === IngredientCategory.LIQUID && unit === 'ml' && value >= 1000) {
    const liters = value / 1000;
    return {
      displayValue: Math.round(liters * 10) / 10,
      displayUnit: 'L',
      rawValue: value,
      rawUnit: 'ml',
    };
  }
  return {
    displayValue: value,
    displayUnit: unit,
    rawValue: value,
    rawUnit: unit,
  };
}

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(Recipe.name) private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(SupplierReceipt.name)
    private readonly receiptModel: Model<SupplierReceiptDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly warehouseStockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockTransferRequest.name)
    private readonly stockRequestModel: Model<StockTransferRequestDocument>,
    @InjectModel(StockLot.name)
    private readonly lotModel: Model<StockLotDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async findIngredientByName(name: string) {
    return this.ingredientModel
      .findOne({ name: { $regex: `^${this.escapeRegex(name)}$`, $options: 'i' } })
      .exec();
  }

  async onModuleInit() {
    const count = await this.ingredientModel.countDocuments().exec();
    if (count === 0) {
      await this.ingredientModel.insertMany(
        DEFAULT_INGREDIENTS.map((d) => ({
          ...d,
          unit: d.unit ?? defaultUnitForCategory(d.category),
        })),
      );
    }
    await this.seedWarehouses();
    await this.syncIngredientCatalog();
    await this.migrateWarehouseStocks();
    await this.migrateLegacyRecords();
    await this.seedDefaultRecipes();
    await this.seedDemoWorkflowData();
  }

  /** Mẫu luồng: NCC → KHO_TONG → phiếu duyệt/chờ duyệt */
  private async seedDemoWorkflowData() {
    const force = process.env.SEED_DEMO_INVENTORY === 'true';
    const exists = await this.receiptModel
      .countDocuments({ documentNumber: 'DEMO-NCC-001' })
      .exec();
    if (exists > 0) return;

    if (!force) {
      const [receiptCount, requestCount] = await Promise.all([
        this.receiptModel.countDocuments().exec(),
        this.stockRequestModel.countDocuments().exec(),
      ]);
      if (receiptCount > 0 || requestCount > 0) return;
    }

    const accounting = await this.userModel.findOne({ role: Role.ACCOUNTING }).exec();
    const warehouseUser = await this.userModel.findOne({ role: Role.WAREHOUSE }).exec();
    if (!accounting || !warehouseUser) return;

    const tea = await this.findIngredientByName('Nước trà đen (pha sẵn)');
    const milk = await this.findIngredientByName('Sữa tươi');
    const sugar = await this.findIngredientByName('Đường');
    const pearl = await this.findIngredientByName('Trân châu đen');
    const matcha = await this.findIngredientByName('Bột matcha');
    if (!tea || !milk || !sugar || !pearl || !matcha) return;

    const kho2 = await this.warehouseModel.findOne({ code: 'KHO2' }).exec();
    const kho1 = await this.warehouseModel.findOne({ code: 'KHO1' }).exec();
    const kho3 = await this.warehouseModel.findOne({ code: 'KHO3' }).exec();
    if (!kho2 || !kho1 || !kho3) return;

    const today = new Date().toISOString().slice(0, 10);

    await this.createSupplierReceipt(
      {
        supplierName: 'Công ty TNHH Nguyên Liệu Trà Sữa ABC',
        documentNumber: 'DEMO-NCC-001',
        documentDate: today,
        note: 'Dữ liệu mẫu — nhập NCC vào kho tổng',
        lines: [
          { ingredientId: milk._id.toString(), quantity: 120_000, unitPrice: 28 },
          { ingredientId: tea._id.toString(), quantity: 100_000, unitPrice: 15 },
          { ingredientId: sugar._id.toString(), quantity: 25_000, unitPrice: 18 },
          { ingredientId: pearl._id.toString(), quantity: 12_000, unitPrice: 45 },
          { ingredientId: matcha._id.toString(), quantity: 4_000, unitPrice: 120 },
        ],
      },
      accounting,
    );

    const completedReq = await this.createStockRequest(
      {
        type: StockRequestType.DISPATCH_FROM_CENTRAL,
        targetWarehouseId: kho1._id.toString(),
        permitDocumentNumber: 'DEMO-CT-CAP-001',
        permitDocumentDate: today,
        businessDate: today,
        purpose: 'Cấp phát đầu ca — KHO1',
        note: 'Dữ liệu mẫu — đã duyệt',
        lines: [
          { ingredientId: milk._id.toString(), quantity: 30_000 },
          { ingredientId: tea._id.toString(), quantity: 25_000 },
        ],
      },
      warehouseUser,
    );

    await this.reviewStockRequest(
      completedReq._id.toString(),
      { approved: true, accountingNote: 'Duyệt mẫu — cấp phát trong ngày' },
      accounting,
    );

    await this.createStockRequest(
      {
        type: StockRequestType.RETURN_TO_CENTRAL,
        targetWarehouseId: kho1._id.toString(),
        parentRequestId: completedReq._id.toString(),
        permitDocumentNumber: 'DEMO-CT-HOAN-001',
        permitDocumentDate: today,
        businessDate: today,
        purpose: 'Hoàn trả cuối ca (mẫu — chờ duyệt)',
        note: 'Hoàn phần còn lại',
        lines: [
          { ingredientId: milk._id.toString(), quantity: 5_000 },
          { ingredientId: tea._id.toString(), quantity: 3_000 },
        ],
      },
      warehouseUser,
    );

    const kho2Req = await this.createStockRequest(
      {
        type: StockRequestType.DISPATCH_FROM_CENTRAL,
        targetWarehouseId: kho2._id.toString(),
        permitDocumentNumber: 'DEMO-CT-CAP-002',
        permitDocumentDate: today,
        businessDate: today,
        purpose: 'Cấp phát KHO2',
        lines: [
          { ingredientId: sugar._id.toString(), quantity: 5_000 },
          { ingredientId: matcha._id.toString(), quantity: 1_500 },
        ],
      },
      warehouseUser,
    );

    await this.reviewStockRequest(
      kho2Req._id.toString(),
      { approved: true, accountingNote: 'Duyệt mẫu KHO2' },
      accounting,
    );

    await this.createStockRequest(
      {
        type: StockRequestType.DISPATCH_FROM_CENTRAL,
        targetWarehouseId: kho3._id.toString(),
        permitDocumentNumber: 'DEMO-CT-XK-003',
        permitDocumentDate: today,
        purpose: 'Bổ sung topping kho lạnh',
        lines: [{ ingredientId: pearl._id.toString(), quantity: 3_000 }],
      },
      warehouseUser,
    );
  }

  private async seedWarehouses() {
    for (const w of DEFAULT_WAREHOUSES) {
      await this.warehouseModel
        .updateOne({ code: w.code }, { $set: w }, { upsert: true })
        .exec();
    }
  }

  private async migrateWarehouseStocks() {
    const existing = await this.warehouseStockModel.countDocuments().exec();
    if (existing > 0) return;

    const warehouses = await this.warehouseModel.find().sort({ sortOrder: 1 }).exec();
    const kho1 = warehouses.find((w) => w.isKitchenSource) ?? warehouses[0];
    if (!kho1) return;

    const ingredients = await this.ingredientModel.find().exec();
    for (const ing of ingredients) {
      for (const wh of warehouses) {
        const exists = await this.warehouseStockModel
          .findOne({ warehouseId: wh._id, ingredientId: ing._id })
          .exec();
        if (exists) continue;

        const initial =
          wh._id.equals(kho1._id) ? (ing.currentStock ?? 0) : 0;
        await this.warehouseStockModel.create({
          warehouseId: wh._id,
          ingredientId: ing._id,
          currentStock: initial,
          minStock: wh._id.equals(kho1._id) ? (ing.minStock ?? 0) : 0,
        });
      }
      await this.syncIngredientTotalStock(ing._id.toString());
    }
  }

  private async migrateLegacyRecords() {
    const kho1 = await this.warehouseModel.findOne({ isKitchenSource: true }).exec();
    if (!kho1) return;

    await this.movementModel
      .updateMany(
        { warehouseId: { $exists: false } },
        { $set: { warehouseId: kho1._id } },
      )
      .exec();

    const kho2 =
      (await this.warehouseModel.findOne({ code: 'KHO2' }).exec()) ?? kho1;
    await this.receiptModel
      .updateMany(
        { warehouseId: { $exists: false } },
        {
          $set: {
            warehouseId: kho2._id,
            warehouseCode: kho2.code,
            warehouseName: kho2.name,
          },
        },
      )
      .exec();
  }

  async findWarehouses(includeInactive = false, branchId?: string) {
    const filter: Record<string, unknown> = includeInactive ? {} : { isActive: true };
    if (branchId) {
      filter.branchId = new Types.ObjectId(branchId);
    }
    return this.warehouseModel.find(filter).sort({ sortOrder: 1 }).exec();
  }

  private async resolveWarehouseIdsForBranch(
    branchId?: string,
  ): Promise<Types.ObjectId[] | undefined> {
    if (!branchId) return undefined;
    const whs = await this.findWarehouses(false, branchId);
    return whs.map((w) => w._id);
  }

  private stockRequestBranchFilter(warehouseIds?: Types.ObjectId[]) {
    if (!warehouseIds?.length) return {};
    return {
      $or: [
        { fromWarehouseId: { $in: warehouseIds } },
        { toWarehouseId: { $in: warehouseIds } },
      ],
    };
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto) {
    const wh = await this.getWarehouseOrThrow(id);

    if (dto.isKitchenSource === true) {
      await this.warehouseModel
        .updateMany(
          { _id: { $ne: wh._id }, isKitchenSource: true },
          { $set: { isKitchenSource: false } },
        )
        .exec();
    }
    if (dto.isCentralWarehouse === true) {
      await this.warehouseModel
        .updateMany(
          { _id: { $ne: wh._id }, isCentralWarehouse: true },
          { $set: { isCentralWarehouse: false } },
        )
        .exec();
    }

    Object.assign(wh, dto);
    return wh.save();
  }

  async updateWarehouseStock(
    warehouseId: string,
    ingredientId: string,
    dto: UpdateWarehouseStockDto,
  ) {
    const wh = await this.getWarehouseOrThrow(warehouseId);
    const row = await this.getOrCreateWarehouseStock(wh._id, new Types.ObjectId(ingredientId));

    if (dto.minStock !== undefined) row.minStock = dto.minStock;
    if (dto.currentStock !== undefined) {
      row.currentStock = dto.currentStock;
    }
    await row.save();
    await this.syncIngredientTotalStock(ingredientId);
    return row;
  }

  private async getKitchenWarehouse(): Promise<WarehouseLocationDocument> {
    const wh = await this.warehouseModel.findOne({ isKitchenSource: true }).exec();
    if (!wh) {
      throw new BadRequestException('Chưa cấu hình kho bếp (KHO1)');
    }
    return wh;
  }

  private async getCentralWarehouse(): Promise<WarehouseLocationDocument> {
    const wh = await this.warehouseModel.findOne({ isCentralWarehouse: true }).exec();
    if (!wh) {
      throw new BadRequestException('Chưa cấu hình kho tổng (KHO_TONG)');
    }
    return wh;
  }

  private async nextStockRequestNumber(): Promise<string> {
    const today = new Date();
    const y = String(today.getFullYear()).slice(-2);
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const count = await this.stockRequestModel
      .countDocuments({ createdAt: { $gte: start, $lt: end } })
      .exec();
    return `PXK${y}${m}${d}${String(count + 1).padStart(2, '0')}`;
  }

  private async getWarehouseOrThrow(id: string) {
    const wh = await this.warehouseModel.findById(id).exec();
    if (!wh) throw new NotFoundException('Không tìm thấy kho');
    return wh;
  }

  private async getOrCreateWarehouseStock(
    warehouseId: Types.ObjectId,
    ingredientId: Types.ObjectId,
  ) {
    let row = await this.warehouseStockModel
      .findOne({ warehouseId, ingredientId })
      .exec();
    if (!row) {
      row = await this.warehouseStockModel.create({
        warehouseId,
        ingredientId,
        currentStock: 0,
        minStock: 0,
      });
    }
    return row;
  }

  private async syncIngredientTotalStock(ingredientId: string) {
    const oid = new Types.ObjectId(ingredientId);
    const rows = await this.warehouseStockModel.find({ ingredientId: oid }).exec();
    const total = rows.reduce((s, r) => s + r.currentStock, 0);
    const kho1 = await this.getKitchenWarehouse();
    const kho1Row = rows.find((r) => r.warehouseId.equals(kho1._id));
    await this.ingredientModel
      .updateOne(
        { _id: oid },
        { currentStock: total, minStock: kho1Row?.minStock ?? 0 },
      )
      .exec();
  }

  /** Gán loại + đơn vị chuẩn; bổ sung nước lọc / nước trà nếu DB cũ thiếu */
  private async syncIngredientCatalog() {
    const all = await this.ingredientModel.find().exec();
    for (const ing of all) {
      const patch: Partial<Ingredient> = {};
      if (!ing.category || ing.category === IngredientCategory.OTHER) {
        patch.category = this.inferCategory(ing.name, ing.unit);
      }
      const cat = patch.category ?? ing.category;
      if (cat === IngredientCategory.LIQUID && ing.unit !== 'ml') {
        patch.unit = 'ml';
      }
      if (Object.keys(patch).length) {
        await this.ingredientModel.updateOne({ _id: ing._id }, patch).exec();
      }
    }

    const ensure = async (dto: CreateIngredientDto) => {
      const exists = await this.findIngredientByName(dto.name);
      if (!exists) {
        try {
          await this.createIngredient(dto);
        } catch (err: unknown) {
          const code = (err as { code?: number })?.code;
          if (code !== 11000) throw err;
        }
      }
    };

    await ensure({
      name: 'Nước lọc',
      category: IngredientCategory.LIQUID,
      currentStock: 50_000,
      minStock: 5_000,
    });
    await ensure({
      name: 'Nước trà đen (pha sẵn)',
      category: IngredientCategory.LIQUID,
      currentStock: 50_000,
      minStock: 5_000,
    });
  }

  private inferCategory(name: string, unit: string): IngredientCategory {
    const n = name.toLowerCase();
    const u = unit.toLowerCase();
    if (u === 'ml' || u === 'l' || n.includes('sữa') || n.includes('nước')) {
      return IngredientCategory.LIQUID;
    }
    if (n.includes('trân châu') || n.includes('thạch') || n.includes('pudding')) {
      return IngredientCategory.TOPPING;
    }
    if (u === 'g' || u === 'kg') {
      return IngredientCategory.DRY;
    }
    return IngredientCategory.OTHER;
  }

  private async seedDefaultRecipes() {
    const menuItems = await this.menuItemModel.find().limit(20).exec();
    if (!menuItems.length) return;

    const ingredients = await this.ingredientModel.find().exec();
    const byName = (n: string) =>
      ingredients.find((i) => i.name.toLowerCase().includes(n.toLowerCase()));

    const teaLiquid = byName('nước trà') ?? byName('trà');
    const water = byName('nước lọc');
    const milk = byName('sữa');
    const sugar = byName('đường');
    const pearl = byName('trân châu');
    const matcha = byName('matcha');
    const cheese = byName('kem');
    const ice = byName('đá');

    for (const menu of menuItems) {
      const exists = await this.recipeModel
        .findOne({ menuItemId: menu._id })
        .exec();
      if (exists) continue;

      const lines: { ingredientId: Types.ObjectId; quantity: number }[] = [];
      const add = (ing?: IngredientDocument, qty = 0) => {
        if (ing && qty > 0) lines.push({ ingredientId: ing._id, quantity: qty });
      };

      if (menu.category === 'Cà phê') {
        add(teaLiquid, 180);
        add(water, 40);
        add(milk, 80);
        add(sugar, 10);
        add(ice, 100);
      } else if (menu.name.toLowerCase().includes('matcha')) {
        add(matcha, 8);
        add(milk, 150);
        add(water, 30);
        add(sugar, 15);
        add(ice, 120);
      } else if (menu.category === 'Kem cheese') {
        add(teaLiquid, 200);
        add(cheese, 30);
        add(sugar, 12);
        add(ice, 100);
      } else {
        add(teaLiquid, 200);
        add(milk, 120);
        add(water, 20);
        add(sugar, 15);
        add(pearl, 40);
        add(ice, 120);
      }

      if (lines.length) {
        await this.recipeModel.create({ menuItemId: menu._id, lines });
      }
    }
  }

  async findAllIngredients(): Promise<IngredientDocument[]> {
    return this.ingredientModel.find().sort({ name: 1 }).exec();
  }

  async createIngredient(dto: CreateIngredientDto): Promise<IngredientDocument> {
    const unit = dto.unit ?? defaultUnitForCategory(dto.category);
    const doc = new this.ingredientModel({
      ...dto,
      unit,
      currentStock: 0,
      minStock: 0,
    });
    const saved = await doc.save();
    const warehouses = await this.findWarehouses();
    const kho1 = await this.getKitchenWarehouse();
    for (const wh of warehouses) {
      const isKho1 = wh._id.equals(kho1._id);
      await this.warehouseStockModel.create({
        warehouseId: wh._id,
        ingredientId: saved._id,
        currentStock: isKho1 ? (dto.currentStock ?? 0) : 0,
        minStock: isKho1 ? (dto.minStock ?? 0) : 0,
      });
    }
    await this.syncIngredientTotalStock(saved._id.toString());
    return saved;
  }

  async updateIngredient(
    id: string,
    dto: UpdateIngredientDto,
  ): Promise<IngredientDocument> {
    const patch = { ...dto };
    if (dto.category && !dto.unit) {
      patch.unit = defaultUnitForCategory(dto.category);
    }
    const doc = await this.ingredientModel
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy nguyên liệu');
    return doc;
  }

  async findRecipes() {
    const recipes = await this.recipeModel.find().exec();
    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

    return recipes.map((r) => {
      const raw = r.toObject();
      const menuItemId = raw.menuItemId?.toString() ?? '';
      const lines = (raw.lines ?? []).map(
        (l: { ingredientId: Types.ObjectId; quantity: number }) => {
          const ingredientId = l.ingredientId?.toString() ?? '';
          return {
            ingredientId,
            quantity: l.quantity,
            ingredientName: ingMap.get(ingredientId)?.name,
            unit: ingMap.get(ingredientId)?.unit,
          };
        },
      );
      return {
        id: r._id.toString(),
        menuItemId,
        intensityPercent: raw.intensityPercent ?? 80,
        sugarPercent: raw.sugarPercent ?? 80,
        icePercent: raw.icePercent ?? 80,
        lines,
      };
    });
  }

  async upsertRecipe(dto: UpsertRecipeDto) {
    const lines = dto.lines.map((l) => ({
      ingredientId: new Types.ObjectId(l.ingredientId),
      quantity: l.quantity,
    }));

    const update: Record<string, unknown> = {
      menuItemId: new Types.ObjectId(dto.menuItemId),
      lines,
    };
    if (dto.intensityPercent != null) {
      update.intensityPercent = Math.min(100, Math.max(0, dto.intensityPercent));
    }

    const doc = await this.recipeModel
      .findOneAndUpdate(
        { menuItemId: new Types.ObjectId(dto.menuItemId) },
        update,
        { upsert: true, new: true },
      )
      .exec();

    return doc;
  }

  async updateSoloRecipe(
    menuItemId: string,
    dto: { intensityPercent?: number; sugarPercent?: number; icePercent?: number },
  ) {
    const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
    const update: Record<string, number> = {};
    if (dto.intensityPercent != null) update.intensityPercent = clamp(dto.intensityPercent);
    if (dto.sugarPercent != null) update.sugarPercent = clamp(dto.sugarPercent);
    if (dto.icePercent != null) update.icePercent = clamp(dto.icePercent);

    return this.recipeModel
      .findOneAndUpdate(
        { menuItemId: new Types.ObjectId(menuItemId) },
        {
          $set: update,
          $setOnInsert: {
            menuItemId: new Types.ObjectId(menuItemId),
            lines: [],
            intensityPercent: 80,
            sugarPercent: 80,
            icePercent: 80,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async getStockDashboard(warehouseId?: string) {
    let wh: WarehouseLocationDocument;
    if (warehouseId) {
      wh = await this.getWarehouseOrThrow(warehouseId);
    } else {
      const kitchen = await this.warehouseModel.findOne({ isKitchenSource: true }).exec();
      if (!kitchen) {
        return [];
      }
      wh = kitchen;
    }
    const stocks = await this.warehouseStockModel
      .find({ warehouseId: wh._id })
      .exec();
    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

    const expiryLots = await this.lotModel
      .find({
        warehouseId: wh._id,
        quantity: { $gt: 0 },
        expiryDate: { $exists: true, $ne: null },
      })
      .sort({ expiryDate: 1 })
      .exec();
    const expiryByIng = new Map<
      string,
      { nearestExpiry: Date; expiringQty: number }
    >();
    for (const lot of expiryLots) {
      const id = lot.ingredientId.toString();
      const cur = expiryByIng.get(id);
      if (!cur || (lot.expiryDate && lot.expiryDate < cur.nearestExpiry)) {
        expiryByIng.set(id, {
          nearestExpiry: lot.expiryDate!,
          expiringQty: lot.quantity,
        });
      } else if (cur && lot.expiryDate?.getTime() === cur.nearestExpiry.getTime()) {
        cur.expiringQty += lot.quantity;
      }
    }

    return stocks
      .map((ws) => {
        const ing = ingMap.get(ws.ingredientId.toString());
        if (!ing) return null;
        const category = ing.category ?? IngredientCategory.OTHER;
        const unit = ing.unit;
        const fmt = formatDisplayStock(ws.currentStock, unit, category);
        const fmtMin = formatDisplayStock(ws.minStock, unit, category);
        const exp = expiryByIng.get(ws.ingredientId.toString());
        return {
          ...ing.toJSON(),
          warehouseId: wh._id.toString(),
          warehouseCode: wh.code,
          warehouseName: wh.name,
          category,
          currentStock: ws.currentStock,
          minStock: ws.minStock,
          isLow: ws.currentStock <= ws.minStock,
          displayStock: fmt.displayValue,
          displayUnit: fmt.displayUnit,
          displayMinStock: fmtMin.displayValue,
          nearestExpiry: exp?.nearestExpiry?.toISOString(),
          expiringQty: exp?.expiringQty,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private sumSupplierReceiptValue(
    receipts: Pick<SupplierReceiptDocument, 'lines'>[],
  ): number {
    let total = 0;
    for (const r of receipts) {
      for (const l of r.lines ?? []) {
        total += Math.round((l.quantity ?? 0) * (l.unitPrice ?? 0));
      }
    }
    return total;
  }

  private async getSupplierReceiptMoneyStats(
    start: Date,
    end: Date,
    warehouseIds?: Types.ObjectId[],
  ) {
    const filter: Record<string, unknown> = {
      documentDate: { $gte: start, $lt: end },
    };
    if (warehouseIds?.length) {
      filter.warehouseId = { $in: warehouseIds };
    }
    const receipts = await this.receiptModel.find(filter).select('lines').exec();
    return {
      count: receipts.length,
      totalValue: this.sumSupplierReceiptValue(receipts),
    };
  }

  async getWarehouseOverview(warehouseId?: string, branchId?: string) {
    const warehouses = await this.findWarehouses(false, branchId);
    const targetId =
      warehouseId ??
      warehouses.find((w) => w.isCentralWarehouse)?._id.toString() ??
      warehouses[0]?._id.toString();
    const warehouseIds = warehouses.map((w) => w._id);
    if (!targetId) {
      return {
        lowCount: 0,
        totalItems: 0,
        liquidLow: 0,
        todayUsageLines: 0,
        todayReceiptCount: 0,
        todayReceiptValue: 0,
        monthReceiptCount: 0,
        monthReceiptValue: 0,
        byCategory: {},
        warehouses: [],
      };
    }
    const stock = await this.getStockDashboard(targetId);
    const byCategory = {
      [IngredientCategory.LIQUID]: stock.filter(
        (s) => s.category === IngredientCategory.LIQUID,
      ),
      [IngredientCategory.DRY]: stock.filter(
        (s) => s.category === IngredientCategory.DRY,
      ),
      [IngredientCategory.TOPPING]: stock.filter(
        (s) => s.category === IngredientCategory.TOPPING,
      ),
      [IngredientCategory.OTHER]: stock.filter(
        (s) => s.category === IngredientCategory.OTHER,
      ),
    };

    const today = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(today);
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);

    const [usage, todayReceipts, monthReceipts] = await Promise.all([
      this.getDailyUsage(today, targetId),
      this.getSupplierReceiptMoneyStats(todayStart, todayEnd, warehouseIds),
      this.getSupplierReceiptMoneyStats(monthStart, monthEnd, warehouseIds),
    ]);

    return {
      warehouseId: targetId,
      lowCount: stock.filter((s) => s.isLow).length,
      totalItems: stock.length,
      liquidLow: byCategory[IngredientCategory.LIQUID].filter((s) => s.isLow)
        .length,
      todayUsageLines: usage.movementCount,
      todayReceiptCount: todayReceipts.count,
      todayReceiptValue: todayReceipts.totalValue,
      monthReceiptCount: monthReceipts.count,
      monthReceiptValue: monthReceipts.totalValue,
      byCategory,
      warehouses: warehouses.map((w) => w.toJSON()),
    };
  }

  async createSupplierReceipt(
    dto: CreateSupplierReceiptDto,
    user: UserDocument,
  ): Promise<SupplierReceiptDocument> {
    if (!dto.lines?.length) {
      throw new BadRequestException('Phải có ít nhất một dòng nguyên liệu');
    }

    const docNo = dto.documentNumber.trim();
    const duplicate = await this.receiptModel
      .findOne({ documentNumber: docNo })
      .exec();
    if (duplicate) {
      throw new BadRequestException(
        `Số chứng từ "${docNo}" đã tồn tại — dùng số HĐ/CT khác`,
      );
    }

    const central = await this.getCentralWarehouse();
    if (dto.warehouseId && dto.warehouseId !== central._id.toString()) {
      throw new BadRequestException(
        'Phiếu nhập NCC chỉ được ghi nhận vào kho tổng (KHO_TONG)',
      );
    }
    const wh = central;

    const receipt = new this.receiptModel({
      supplierName: dto.supplierName,
      documentNumber: dto.documentNumber,
      documentDate: new Date(dto.documentDate),
      warehouseId: wh._id,
      warehouseCode: wh.code,
      warehouseName: wh.name,
      note: dto.note,
      lines: dto.lines.map((l) => ({
        ingredientId: new Types.ObjectId(l.ingredientId),
        quantity: l.quantity,
        unitPrice: l.unitPrice ?? 0,
        expiryDate: l.expiryDate ? new Date(l.expiryDate) : undefined,
      })),
      createdBy: user._id,
      createdByName: user.fullName,
    });

    const saved = await receipt.save();
    const docDate = new Date(dto.documentDate);

    for (const line of dto.lines) {
      const ing = await this.ingredientModel.findById(line.ingredientId).exec();
      const expiryDate = this.resolveLineExpiryDate(
        line.expiryDate,
        docDate,
        ing ?? undefined,
      );
      await this.applyStockChange(
        wh._id.toString(),
        line.ingredientId,
        line.quantity,
        StockMovementType.SUPPLIER_IN,
        {
          supplierReceiptId: saved._id.toString(),
          note: `NCC ${dto.supplierName} · ${wh.code} · CT ${dto.documentNumber}`,
          movementDate: docDate,
          expiryDate,
        },
      );
    }

    return saved;
  }

  private resolveLineExpiryDate(
    lineExpiry: string | undefined,
    documentDate: Date,
    ingredient?: IngredientDocument,
  ): Date | undefined {
    if (lineExpiry) {
      return new Date(lineExpiry);
    }
    const days = ingredient?.shelfLifeDays;
    if (days != null && days > 0) {
      const d = new Date(documentDate);
      d.setDate(d.getDate() + days);
      return d;
    }
    return undefined;
  }

  async transferStock(_dto: TransferStockDto) {
    throw new BadRequestException(
      'Chuyển kho phải qua phiếu xin nhập/xuất và kế toán duyệt (POST /inventory/stock-requests)',
    );
  }

  async createStockRequest(dto: CreateStockRequestDto, user: UserDocument) {
    if (!dto.lines?.length) {
      throw new BadRequestException('Phải có ít nhất một dòng nguyên liệu');
    }

    const dailyTypes = [
      StockRequestType.DISPATCH_FROM_CENTRAL,
      StockRequestType.RETURN_TO_CENTRAL,
    ];
    if (
      dailyTypes.includes(dto.type) &&
      user.role !== Role.STORE_MANAGER &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ quản lý cửa hàng được lập phiếu cấp phát / hoàn trả trong ngày',
      );
    }
    if (
      dto.type === StockRequestType.REPLENISH_FROM_CENTRAL &&
      user.role !== Role.WAREHOUSE &&
      user.role !== Role.STORE_MANAGER &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ nhân viên kho hoặc quản lý được lập phiếu bổ sung tồn',
      );
    }

    const central = await this.getCentralWarehouse();
    const target = await this.getWarehouseOrThrow(dto.targetWarehouseId);

    if (target.isCentralWarehouse) {
      throw new BadRequestException('Kho đích không được là kho tổng');
    }

    let fromWh: WarehouseLocationDocument = central;
    let toWh: WarehouseLocationDocument = target;
    let parentRequestNumber: string | undefined;
    let parentRequestId: Types.ObjectId | undefined;

    const businessDate =
      dto.businessDate?.slice(0, 10) ??
      dto.permitDocumentDate.slice(0, 10);

    if (dto.type === StockRequestType.RETURN_TO_CENTRAL) {
      fromWh = target;
      toWh = central;
      if (!dto.parentRequestId?.trim()) {
        throw new BadRequestException(
          'Hoàn trả cuối ngày phải chọn phiếu cấp phát trong ngày (mã PXK cấp phát)',
        );
      }
      const parent = await this.stockRequestModel
        .findById(dto.parentRequestId)
        .exec();
      if (!parent) {
        throw new BadRequestException('Không tìm thấy phiếu cấp phát gốc');
      }
      if (parent.type !== StockRequestType.DISPATCH_FROM_CENTRAL) {
        throw new BadRequestException('Phiếu gốc phải là phiếu cấp phát trong ngày');
      }
      if (parent.status !== StockRequestStatus.COMPLETED) {
        throw new BadRequestException('Phiếu cấp phát chưa hoàn tất — chưa thể hoàn trả');
      }
      if (parent.returnClosureStatus === ReturnClosureStatus.CLOSED) {
        throw new BadRequestException('Phiếu cấp phát đã hoàn trả đủ');
      }
      if (parent.toWarehouseId.toString() !== target._id.toString()) {
        throw new BadRequestException('Phiếu gốc không thuộc kho đang hoàn trả');
      }
      if (parent.businessDate && parent.businessDate !== businessDate) {
        throw new BadRequestException(
          'Ngày hoàn trả phải trùng ngày nghiệp vụ của phiếu cấp phát',
        );
      }
      this.validateReturnLines(parent, dto.lines);
      parentRequestId = parent._id;
      parentRequestNumber = parent.requestNumber;
    } else if (
      dto.type === StockRequestType.DISPATCH_FROM_CENTRAL ||
      dto.type === StockRequestType.REPLENISH_FROM_CENTRAL
    ) {
      /* central → branch */
    } else {
      throw new BadRequestException('Loại phiếu không hợp lệ');
    }

    const requestNumber = await this.nextStockRequestNumber();
    const doc = new this.stockRequestModel({
      requestNumber,
      type: dto.type,
      status: StockRequestStatus.PENDING,
      fromWarehouseId: fromWh._id,
      fromWarehouseCode: fromWh.code,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh._id,
      toWarehouseCode: toWh.code,
      toWarehouseName: toWh.name,
      permitDocumentNumber: dto.permitDocumentNumber.trim(),
      permitDocumentDate: new Date(dto.permitDocumentDate),
      businessDate,
      parentRequestId,
      parentRequestNumber,
      returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
      purpose: dto.purpose,
      note: dto.note,
      lines: dto.lines.map((l) => ({
        ingredientId: new Types.ObjectId(l.ingredientId),
        quantity: l.quantity,
        returnedQuantity: 0,
      })),
      requestedBy: user._id,
      requestedByName: user.fullName,
      submittedAt: new Date(),
    });

    return doc.save();
  }

  private validateReturnLines(
    parent: StockTransferRequestDocument,
    lines: { ingredientId: string; quantity: number }[],
  ) {
    for (const line of lines) {
      const pl = parent.lines.find(
        (l) => l.ingredientId.toString() === line.ingredientId,
      );
      if (!pl) {
        throw new BadRequestException(
          'Nguyên liệu hoàn trả phải nằm trong phiếu cấp phát gốc',
        );
      }
      const returned = pl.returnedQuantity ?? 0;
      const remaining = pl.quantity - returned;
      if (line.quantity > remaining + 0.0001) {
        throw new BadRequestException(
          `Số lượng hoàn trả vượt tồn còn lại của phiếu cấp phát (còn ${remaining})`,
        );
      }
    }
  }

  async findStockRequests(filters?: {
    status?: StockRequestStatus;
    type?: StockRequestType;
    businessDate?: string;
    returnClosureStatus?: ReturnClosureStatus;
    parentRequestId?: string;
    branchId?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (filters?.status) filter.status = filters.status;
    if (filters?.type) filter.type = filters.type;
    if (filters?.businessDate) filter.businessDate = filters.businessDate;
    if (filters?.returnClosureStatus) {
      filter.returnClosureStatus = filters.returnClosureStatus;
    }
    if (filters?.parentRequestId) {
      filter.parentRequestId = new Types.ObjectId(filters.parentRequestId);
    }

    const warehouseIds = await this.resolveWarehouseIdsForBranch(filters?.branchId);
    Object.assign(filter, this.stockRequestBranchFilter(warehouseIds));

    const list = await this.stockRequestModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();

    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

    return list.map((r) => this.mapStockRequest(r, ingMap));
  }

  private mapStockRequest(
    r: StockTransferRequestDocument,
    ingMap: Map<string, IngredientDocument>,
  ) {
    const raw = r.toObject();
    const lines = (raw.lines ?? []).map(
      (l: {
        ingredientId: Types.ObjectId;
        quantity: number;
        returnedQuantity?: number;
      }) => {
        const ingredientId = l.ingredientId?.toString() ?? '';
        const returned = l.returnedQuantity ?? 0;
        const remaining = Math.max(0, l.quantity - returned);
        return {
          ingredientId,
          quantity: l.quantity,
          returnedQuantity: returned,
          remainingQuantity: remaining,
          ingredientName: ingMap.get(ingredientId)?.name,
          unit: ingMap.get(ingredientId)?.unit,
        };
      },
    );
    return {
      id: r._id.toString(),
      requestNumber: raw.requestNumber,
      type: raw.type,
      status: raw.status,
      fromWarehouseId: raw.fromWarehouseId?.toString(),
      fromWarehouseCode: raw.fromWarehouseCode,
      fromWarehouseName: raw.fromWarehouseName,
      toWarehouseId: raw.toWarehouseId?.toString(),
      toWarehouseCode: raw.toWarehouseCode,
      toWarehouseName: raw.toWarehouseName,
      permitDocumentNumber: raw.permitDocumentNumber,
      permitDocumentDate: raw.permitDocumentDate,
      businessDate: raw.businessDate,
      parentRequestId: raw.parentRequestId?.toString(),
      parentRequestNumber: raw.parentRequestNumber,
      returnClosureStatus: raw.returnClosureStatus,
      purpose: raw.purpose,
      note: raw.note,
      lines,
      requestedByName: raw.requestedByName,
      submittedAt: raw.submittedAt,
      reviewedByName: raw.reviewedByName,
      reviewedAt: raw.reviewedAt,
      accountingNote: raw.accountingNote,
      rejectReason: raw.rejectReason,
      completedAt: raw.completedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  /** Phiếu cấp phát trong ngày còn chờ hoàn trả (để lập phiếu hoàn trả) */
  async findOpenDispatchForReturn(targetWarehouseId: string, businessDate?: string) {
    const date = businessDate ?? new Date().toISOString().slice(0, 10);
    const list = await this.stockRequestModel
      .find({
        type: StockRequestType.DISPATCH_FROM_CENTRAL,
        status: StockRequestStatus.COMPLETED,
        toWarehouseId: new Types.ObjectId(targetWarehouseId),
        businessDate: date,
        returnClosureStatus: {
          $in: [ReturnClosureStatus.OPEN, ReturnClosureStatus.PARTIAL],
        },
      })
      .sort({ completedAt: -1 })
      .exec();
    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));
    return list.map((r) => this.mapStockRequest(r, ingMap));
  }

  async getOperationsDashboard(branchId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(today);
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 1);

    const warehouseIds = await this.resolveWarehouseIdsForBranch(branchId);
    const branchStockFilter = this.stockRequestBranchFilter(warehouseIds);
    const lotFilter =
      warehouseIds?.length ? { warehouseId: { $in: warehouseIds } } : {};

    const [
      pendingApproval,
      pendingReturnsToday,
      completedIssuesToday,
      completedReturnsToday,
      todayReceipts,
      monthReceipts,
      expiringSoonCount,
    ] = await Promise.all([
      this.stockRequestModel
        .countDocuments({ status: StockRequestStatus.PENDING, ...branchStockFilter })
        .exec(),
      this.stockRequestModel
        .countDocuments({
          type: StockRequestType.RETURN_TO_CENTRAL,
          status: StockRequestStatus.PENDING,
          businessDate: today,
          ...branchStockFilter,
        })
        .exec(),
      this.stockRequestModel
        .countDocuments({
          type: StockRequestType.DISPATCH_FROM_CENTRAL,
          status: StockRequestStatus.COMPLETED,
          businessDate: today,
          ...branchStockFilter,
        })
        .exec(),
      this.stockRequestModel
        .countDocuments({
          type: StockRequestType.RETURN_TO_CENTRAL,
          status: StockRequestStatus.COMPLETED,
          businessDate: today,
          ...branchStockFilter,
        })
        .exec(),
      this.getSupplierReceiptMoneyStats(todayStart, todayEnd, warehouseIds),
      this.getSupplierReceiptMoneyStats(monthStart, monthEnd, warehouseIds),
      this.countExpiringLots(7, lotFilter),
    ]);

    return {
      businessDate: today,
      pendingApproval,
      openIssuesToday: 0,
      partialIssuesToday: 0,
      pendingReturnsToday,
      completedIssuesToday,
      completedReturnsToday,
      overdueOpenIssues: 0,
      needsEndOfDayReturn: 0,
      expiringSoonCount,
      todayReceiptCount: todayReceipts.count,
      todayReceiptValue: todayReceipts.totalValue,
      monthReceiptCount: monthReceipts.count,
      monthReceiptValue: monthReceipts.totalValue,
    };
  }

  async getExpiryAlerts(withinDays = 7, branchId?: string) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + withinDays);
    deadline.setHours(23, 59, 59, 999);

    const warehouseIds = await this.resolveWarehouseIdsForBranch(branchId);
    const lotFilter: Record<string, unknown> = {
      quantity: { $gt: 0 },
      expiryDate: { $exists: true, $ne: null, $lte: deadline },
    };
    if (warehouseIds?.length) {
      lotFilter.warehouseId = { $in: warehouseIds };
    }

    const lots = await this.lotModel
      .find(lotFilter)
      .sort({ expiryDate: 1 })
      .limit(100)
      .exec();

    const [ingredients, warehouses] = await Promise.all([
      this.ingredientModel.find().exec(),
      branchId ? this.findWarehouses(false, branchId) : this.findWarehouses(),
    ]);
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));
    const whMap = new Map(warehouses.map((w) => [w._id.toString(), w]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return lots.map((lot) => {
      const ing = ingMap.get(lot.ingredientId.toString());
      const wh = whMap.get(lot.warehouseId.toString());
      const expiry = lot.expiryDate ? new Date(lot.expiryDate) : undefined;
      const daysLeft = expiry
        ? Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
        : undefined;
      return {
        ingredientId: lot.ingredientId.toString(),
        ingredientName: ing?.name ?? '—',
        unit: ing?.unit ?? '',
        warehouseCode: wh?.code ?? '',
        warehouseName: wh?.name ?? '',
        quantity: lot.quantity,
        expiryDate: expiry?.toISOString(),
        daysLeft,
        isExpired: daysLeft != null && daysLeft < 0,
      };
    });
  }

  private async countExpiringLots(
    withinDays: number,
    extraFilter: Record<string, unknown> = {},
  ) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + withinDays);
    deadline.setHours(23, 59, 59, 999);
    return this.lotModel
      .countDocuments({
        quantity: { $gt: 0 },
        expiryDate: { $exists: true, $ne: null, $lte: deadline },
        ...extraFilter,
      })
      .exec();
  }

  private async addStockLot(
    warehouseId: string,
    ingredientId: string,
    quantity: number,
    expiryDate?: Date,
    refs?: { supplierReceiptId?: string; stockRequestId?: string },
  ) {
    if (quantity <= 0) return;
    await this.lotModel.create({
      warehouseId: new Types.ObjectId(warehouseId),
      ingredientId: new Types.ObjectId(ingredientId),
      quantity,
      expiryDate,
      supplierReceiptId: refs?.supplierReceiptId
        ? new Types.ObjectId(refs.supplierReceiptId)
        : undefined,
      stockRequestId: refs?.stockRequestId
        ? new Types.ObjectId(refs.stockRequestId)
        : undefined,
      receivedAt: new Date(),
    });
  }

  private async consumeStockLotsFIFO(
    warehouseId: string,
    ingredientId: string,
    quantity: number,
  ): Promise<{ quantity: number; expiryDate?: Date }[]> {
    const lots = await this.lotModel
      .find({
        warehouseId: new Types.ObjectId(warehouseId),
        ingredientId: new Types.ObjectId(ingredientId),
        quantity: { $gt: 0 },
      })
      .sort({ expiryDate: 1, receivedAt: 1 })
      .exec();

    let remaining = quantity;
    const slices: { quantity: number; expiryDate?: Date }[] = [];

    for (const lot of lots) {
      if (remaining <= 0.0001) break;
      const take = Math.min(lot.quantity, remaining);
      lot.quantity = Math.max(0, lot.quantity - take);
      if (lot.quantity <= 0.0001) {
        await lot.deleteOne();
      } else {
        await lot.save();
      }
      slices.push({ quantity: take, expiryDate: lot.expiryDate });
      remaining -= take;
    }

    if (remaining > 0.0001) {
      slices.push({ quantity: remaining, expiryDate: undefined });
    }

    return slices;
  }

  async reviewStockRequest(
    id: string,
    dto: ReviewStockRequestDto,
    user: UserDocument,
  ) {
    const req = await this.stockRequestModel.findById(id).exec();
    if (!req) throw new NotFoundException('Không tìm thấy phiếu');

    if (req.status !== StockRequestStatus.PENDING) {
      throw new BadRequestException('Phiếu không ở trạng thái chờ duyệt');
    }

    req.reviewedBy = user._id;
    req.reviewedByName = user.fullName;
    req.reviewedAt = new Date();
    req.accountingNote = dto.accountingNote;

    if (!dto.approved) {
      if (!dto.rejectReason?.trim()) {
        throw new BadRequestException('Cần lý do từ chối');
      }
      req.status = StockRequestStatus.REJECTED;
      req.rejectReason = dto.rejectReason.trim();
      return req.save();
    }

    req.status = StockRequestStatus.APPROVED;
    await req.save();
    await this.executeStockRequest(req);
    if (req.type === StockRequestType.DISPATCH_FROM_CENTRAL) {
      req.returnClosureStatus = ReturnClosureStatus.NOT_APPLICABLE;
    } else if (req.type === StockRequestType.REPLENISH_FROM_CENTRAL) {
      req.returnClosureStatus = ReturnClosureStatus.NOT_APPLICABLE;
    }
    if (
      req.type === StockRequestType.RETURN_TO_CENTRAL &&
      req.parentRequestId
    ) {
      await this.applyReturnToParent(req);
    }
    req.status = StockRequestStatus.COMPLETED;
    req.completedAt = new Date();
    return req.save();
  }

  private async applyReturnToParent(returnReq: StockTransferRequestDocument) {
    const parent = await this.stockRequestModel
      .findById(returnReq.parentRequestId)
      .exec();
    if (!parent) return;

    for (const line of returnReq.lines) {
      const pl = parent.lines.find((l) =>
        l.ingredientId.equals(line.ingredientId),
      );
      if (pl) {
        pl.returnedQuantity = (pl.returnedQuantity ?? 0) + line.quantity;
      }
    }

    const allClosed = parent.lines.every(
      (l) => (l.returnedQuantity ?? 0) >= l.quantity - 0.0001,
    );
    const anyReturned = parent.lines.some((l) => (l.returnedQuantity ?? 0) > 0);
    parent.returnClosureStatus = allClosed
      ? ReturnClosureStatus.CLOSED
      : anyReturned
        ? ReturnClosureStatus.PARTIAL
        : ReturnClosureStatus.OPEN;
    await parent.save();
  }

  private async executeStockRequest(req: StockTransferRequestDocument) {
    const note = `Phiếu ${req.requestNumber} · CT ${req.permitDocumentNumber}`;
    const meta = {
      stockRequestId: req._id.toString(),
      note,
      movementDate: req.permitDocumentDate ?? new Date(),
    };

    for (const line of req.lines) {
      const ingId = line.ingredientId.toString();
      const qty = line.quantity;
      const fromId = req.fromWarehouseId.toString();
      const toId = req.toWarehouseId.toString();

      const slices = await this.consumeStockLotsFIFO(fromId, ingId, qty);
      await this.applyStockChange(
        fromId,
        ingId,
        -qty,
        StockMovementType.TRANSFER_OUT,
        meta,
        { skipLotConsume: true },
      );
      for (const slice of slices) {
        await this.applyStockChange(
          toId,
          ingId,
          slice.quantity,
          StockMovementType.TRANSFER_IN,
          meta,
          { skipLotConsume: true },
        );
        await this.addStockLot(
          toId,
          ingId,
          slice.quantity,
          slice.expiryDate,
          { stockRequestId: req._id.toString() },
        );
      }
    }
  }

  async getDocumentLedger(month: string, branchId?: string) {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const warehouseIds = await this.resolveWarehouseIdsForBranch(branchId);
    const receiptFilter: Record<string, unknown> = {
      documentDate: { $gte: start, $lt: end },
    };
    if (warehouseIds?.length) {
      receiptFilter.warehouseId = { $in: warehouseIds };
    }
    const requestFilter: Record<string, unknown> = {
      status: StockRequestStatus.COMPLETED,
      completedAt: { $gte: start, $lt: end },
      ...this.stockRequestBranchFilter(warehouseIds),
    };

    const [receipts, requests, ingredients] = await Promise.all([
      this.receiptModel.find(receiptFilter).sort({ documentDate: 1 }).exec(),
      this.stockRequestModel.find(requestFilter).sort({ completedAt: 1 }).exec(),
      this.ingredientModel.find().exec(),
    ]);

    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));
    const supplierReceipts = receipts.map((r) =>
      this.mapSupplierReceipt(r, ingMap),
    );
    const supplierReceiptTotalValue = supplierReceipts.reduce(
      (sum, r) => sum + (r.totalValue ?? 0),
      0,
    );

    return {
      month,
      supplierReceipts,
      stockRequests: requests.map((r) => r.toJSON()),
      summary: {
        supplierReceiptCount: supplierReceipts.length,
        completedRequestCount: requests.length,
        supplierReceiptTotalValue,
      },
    };
  }

  async findSupplierReceipts(branchId?: string) {
    const warehouseIds = await this.resolveWarehouseIdsForBranch(branchId);
    const filter: Record<string, unknown> = {};
    if (warehouseIds?.length) {
      filter.warehouseId = { $in: warehouseIds };
    }
    const receipts = await this.receiptModel
      .find(filter)
      .sort({ documentDate: -1, createdAt: -1 })
      .limit(100)
      .exec();
    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));
    return receipts.map((r) => this.mapSupplierReceipt(r, ingMap));
  }

  private mapSupplierReceipt(
    r: SupplierReceiptDocument,
    ingMap: Map<string, IngredientDocument>,
  ) {
    const raw = r.toObject();
    const lines = (raw.lines ?? []).map(
      (l: {
        ingredientId: Types.ObjectId;
        quantity: number;
        unitPrice?: number;
        expiryDate?: Date;
      }) => {
        const id = l.ingredientId?.toString() ?? '';
        const ing = ingMap.get(id);
        const unitPrice = l.unitPrice ?? 0;
        const quantity = l.quantity ?? 0;
        return {
          ingredientId: id,
          ingredientName: ing?.name,
          unit: ing?.unit,
          quantity,
          unitPrice,
          lineTotal: Math.round(quantity * unitPrice),
          expiryDate: l.expiryDate
            ? new Date(l.expiryDate).toISOString()
            : undefined,
        };
      },
    );
    const totalValue = lines.reduce(
      (sum: number, line: { lineTotal: number }) => sum + line.lineTotal,
      0,
    );
    return {
      id: r._id.toString(),
      supplierName: raw.supplierName,
      documentNumber: raw.documentNumber,
      warehouseId: raw.warehouseId?.toString(),
      warehouseCode: raw.warehouseCode,
      warehouseName: raw.warehouseName,
      documentDate: raw.documentDate,
      note: raw.note,
      lines,
      lineCount: lines.length,
      totalValue,
      createdByName: raw.createdByName,
      createdAt: raw.createdAt,
    };
  }

  async getDailyUsage(dateStr: string, warehouseId?: string) {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const filter: Record<string, unknown> = {
      type: StockMovementType.ORDER_OUT,
      movementDate: { $gte: start, $lt: end },
    };
    if (warehouseId) {
      filter.warehouseId = new Types.ObjectId(warehouseId);
    }

    const movements = await this.movementModel.find(filter).exec();

    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

    const usageMap = new Map<
      string,
      { ingredientId: string; name: string; unit: string; totalUsed: number }
    >();

    for (const m of movements) {
      const id = m.ingredientId.toString();
      const ing = ingMap.get(id);
      if (!ing) continue;
      const used = Math.abs(m.quantity);
      const prev = usageMap.get(id);
      if (prev) prev.totalUsed += used;
      else
        usageMap.set(id, {
          ingredientId: id,
          name: ing.name,
          unit: ing.unit,
          totalUsed: used,
        });
    }

    return {
      date: dateStr,
      items: Array.from(usageMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      movementCount: movements.length,
    };
  }

  /** Cảnh báo tồn thấp cho POS thu ngân — kho bếp (KHO1) */
  async getPosStockAlerts() {
    const warehouses = await this.findWarehouses();
    const kitchen =
      warehouses.find((w) => w.isKitchenSource) ?? warehouses[0];
    if (!kitchen) {
      return { count: 0, items: [] as { name: string; warehouseName: string }[] };
    }
    const stock = await this.getStockDashboard(kitchen._id.toString());
    const low = stock.filter((s) => s.isLow);
    return {
      count: low.length,
      items: low.slice(0, 10).map((s) => ({
        name: s.name,
        warehouseName: s.warehouseName,
      })),
    };
  }

  async deductForOrder(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn');

    if (order.inventoryDeducted) {
      return;
    }

    const status = normalizeOrderStatus(order.status);
    if (status !== OrderStatus.READY && status !== OrderStatus.COMPLETED) {
      return;
    }

    const aggregated = new Map<string, number>();

    const ingredients = await this.ingredientModel.find().exec();
    const ingById = new Map(ingredients.map((i) => [i._id.toString(), i]));

    const lineMultiplier = (
      ingredientId: string,
      orderLine: { sugarPercent?: number; icePercent?: number },
    ) => {
      const ing = ingById.get(ingredientId);
      const name = ing?.name?.toLowerCase() ?? '';
      if (name.includes('đường')) return (orderLine.sugarPercent ?? 100) / 100;
      if (name.includes('đá')) return (orderLine.icePercent ?? 100) / 100;
      return 1;
    };

    for (const item of order.items) {
      const recipe = await this.recipeModel
        .findOne({ menuItemId: item.menuItemId })
        .exec();

      if (!recipe?.lines?.length) {
        continue;
      }

      for (const line of recipe.lines) {
        const id = line.ingredientId.toString();
        const mult = lineMultiplier(id, item);
        const need = line.quantity * item.quantity * mult;
        aggregated.set(id, (aggregated.get(id) ?? 0) + need);
      }
    }

    if (aggregated.size === 0) {
      order.inventoryDeducted = true;
      await order.save();
      return;
    }

    const kitchenWh = await this.getKitchenWarehouse();
    const now = new Date();
    for (const [ingredientId, qty] of aggregated) {
      await this.applyStockChange(
        kitchenWh._id.toString(),
        ingredientId,
        -qty,
        StockMovementType.ORDER_OUT,
        {
          orderId: order._id.toString(),
          note: `Đơn #${order.orderNumber} · HĐ ${order.invoiceNumber} · ${kitchenWh.code}`,
          movementDate: now,
        },
      );
    }

    order.inventoryDeducted = true;
    await order.save();
  }

  private async applyStockChange(
    warehouseId: string,
    ingredientId: string,
    delta: number,
    type: StockMovementType,
    meta: {
      orderId?: string;
      supplierReceiptId?: string;
      stockRequestId?: string;
      note?: string;
      movementDate?: Date;
      expiryDate?: Date;
    },
    opts?: { skipLotConsume?: boolean },
  ) {
    const wh = await this.getWarehouseOrThrow(warehouseId);
    const ing = await this.ingredientModel.findById(ingredientId).exec();
    if (!ing) throw new NotFoundException('Không tìm thấy nguyên liệu');

    if (delta < 0 && !opts?.skipLotConsume) {
      await this.consumeStockLotsFIFO(warehouseId, ingredientId, Math.abs(delta));
    }

    const row = await this.getOrCreateWarehouseStock(wh._id, ing._id);
    const next = row.currentStock + delta;
    if (next < 0) {
      throw new BadRequestException(
        `Không đủ tồn tại ${wh.name} — "${ing.name}" (cần ${Math.abs(delta)}${ing.unit}, còn ${row.currentStock}${ing.unit})`,
      );
    }

    row.currentStock = next;
    await row.save();
    await this.syncIngredientTotalStock(ingredientId);

    if (delta > 0 && meta.expiryDate && !opts?.skipLotConsume) {
      await this.addStockLot(
        warehouseId,
        ingredientId,
        delta,
        meta.expiryDate,
        {
          supplierReceiptId: meta.supplierReceiptId,
          stockRequestId: meta.stockRequestId,
        },
      );
    }

    await this.movementModel.create({
      warehouseId: wh._id,
      ingredientId: ing._id,
      type,
      quantity: delta,
      balanceAfter: next,
      orderId: meta.orderId ? new Types.ObjectId(meta.orderId) : undefined,
      supplierReceiptId: meta.supplierReceiptId
        ? new Types.ObjectId(meta.supplierReceiptId)
        : undefined,
      stockRequestId: meta.stockRequestId
        ? new Types.ObjectId(meta.stockRequestId)
        : undefined,
      note: meta.note,
      movementDate: meta.movementDate ?? new Date(),
    });
  }

  /** Báo cáo: tồn kho toàn bộ kho */
  async getStockSnapshotReport() {
    const warehouses = await this.findWarehouses();
    const rows: {
      warehouseCode: string;
      warehouseName: string;
      ingredientName: string;
      category: string;
      currentStock: number;
      minStock: number;
      displayStock: number;
      displayMinStock: number;
      displayUnit: string;
      isLow: boolean;
    }[] = [];

    for (const wh of warehouses) {
      const stock = await this.getStockDashboard(wh._id.toString());
      for (const item of stock) {
        rows.push({
          warehouseCode: item.warehouseCode,
          warehouseName: item.warehouseName,
          ingredientName: item.name,
          category: item.category,
          currentStock: item.currentStock,
          minStock: item.minStock,
          displayStock: item.displayStock,
          displayMinStock: item.displayMinStock,
          displayUnit: item.displayUnit,
          isLow: item.isLow,
        });
      }
    }
    return rows;
  }

  /** Báo cáo: nhật ký xuất nhập kho trong ngày */
  async getMovementJournal(dateStr: string) {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const movements = await this.movementModel
      .find({ movementDate: { $gte: start, $lt: end } })
      .sort({ createdAt: 1 })
      .exec();

    const [ingredients, warehouses] = await Promise.all([
      this.ingredientModel.find().exec(),
      this.warehouseModel.find().exec(),
    ]);
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));
    const whMap = new Map(warehouses.map((w) => [w._id.toString(), w]));

    return movements.map((m) => {
      const ing = ingMap.get(m.ingredientId.toString());
      const wh = whMap.get(m.warehouseId.toString());
      return {
        time: (m.createdAt ?? m.movementDate ?? new Date()).toISOString(),
        type: m.type,
        typeLabel: STOCK_MOVEMENT_LABELS[m.type as StockMovementType] ?? m.type,
        ingredientName: ing?.name ?? '—',
        unit: ing?.unit ?? '',
        warehouseCode: wh?.code ?? '',
        warehouseName: wh?.name ?? '',
        quantity: m.quantity,
        balanceAfter: m.balanceAfter,
        note: m.note,
      };
    });
  }

  /** Báo cáo: phiếu NCC trong ngày */
  async getSupplierReceiptsForDate(dateStr: string) {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const receipts = await this.receiptModel
      .find({ documentDate: { $gte: start, $lt: end } })
      .sort({ documentDate: 1 })
      .exec();

    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

    return receipts.map((r) => {
      const lines = (r.lines ?? []).map((l) => {
        const ing = ingMap.get(l.ingredientId.toString());
        const lineTotal = (l.quantity ?? 0) * (l.unitPrice ?? 0);
        return {
          ingredientName: ing?.name ?? '—',
          quantity: l.quantity,
          unit: ing?.unit ?? '',
          unitPrice: l.unitPrice ?? 0,
          lineTotal,
          expiryDate: l.expiryDate?.toISOString(),
        };
      });
      const totalValue = lines.reduce((s, l) => s + l.lineTotal, 0);
      return {
        id: r._id.toString(),
        documentNumber: r.documentNumber,
        supplierName: r.supplierName,
        documentDate: r.documentDate.toISOString(),
        warehouseCode: r.warehouseCode,
        warehouseName: r.warehouseName,
        lineCount: lines.length,
        totalValue,
        lines,
        note: r.note,
        createdByName: r.createdByName,
        createdAt: r.createdAt?.toISOString(),
      };
    });
  }

  /** Báo cáo: phiếu chuyển kho / cấp phát / hoàn trả theo ngày nghiệp vụ */
  async getStockVouchersForDate(dateStr: string) {
    const list = await this.stockRequestModel
      .find({ businessDate: dateStr })
      .sort({ createdAt: 1 })
      .exec();
    const ingredients = await this.ingredientModel.find().exec();
    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));

    return list.map((r) => {
      const raw = r.toObject();
      const lineSummary = (raw.lines ?? [])
        .map((l: { ingredientId: Types.ObjectId; quantity: number }) => {
          const ing = ingMap.get(l.ingredientId.toString());
          return `${ing?.name ?? '?'}: ${l.quantity}${ing?.unit ?? ''}`;
        })
        .join('; ');
      return {
        requestNumber: raw.requestNumber,
        type: raw.type,
        status: raw.status,
        fromWarehouse: raw.fromWarehouseName,
        toWarehouse: raw.toWarehouseName,
        permitDocumentNumber: raw.permitDocumentNumber,
        businessDate: raw.businessDate,
        parentRequestNumber: raw.parentRequestNumber,
        requestedByName: raw.requestedByName,
        reviewedByName: raw.reviewedByName,
        lineSummary,
        completedAt: raw.completedAt?.toISOString(),
      };
    });
  }
}
