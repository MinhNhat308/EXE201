import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '../common/enums/order-status.enum';
import { ReturnClosureStatus } from '../common/enums/return-closure-status.enum';
import { Role } from '../common/enums/role.enum';
import { StockMovementType } from '../common/enums/stock-movement-type.enum';
import { StockRequestStatus } from '../common/enums/stock-request-status.enum';
import { StockRequestType } from '../common/enums/stock-request-type.enum';
import { WorkShift } from '../common/enums/work-shift.enum';
import { Ingredient, IngredientDocument } from '../modules/inventory/schemas/ingredient.schema';
import { Recipe, RecipeDocument } from '../modules/inventory/schemas/recipe.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../modules/inventory/schemas/stock-movement.schema';
import {
  StockTransferRequest,
  StockTransferRequestDocument,
} from '../modules/inventory/schemas/stock-transfer-request.schema';
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
import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';
import {
  ShiftSession,
  ShiftSessionDocument,
} from '../modules/shifts/schemas/shift-session.schema';
import { StockLot, StockLotDocument } from '../modules/inventory/schemas/stock-lot.schema';
import {
  PaymentMethodConfig,
  PaymentMethodDocument,
} from '../modules/payment-methods/schemas/payment-method.schema';
import { User, UserDocument } from '../modules/users/schemas/user.schema';

const SEED_MARKER = 'STORE-RPT-SEED';
const SEED_VERSION = 'store-flow-v4';
const ORDER_PREFIX = 'STORE-RPT-';
const LIVE_PREFIX = 'STORE-LIVE-';
const HISTORY_DAYS = 7;
const ORDERS_PER_DAY = 14;

@Injectable()
export class DemoStoreReportsSeedService {
  private readonly logger = new Logger(DemoStoreReportsSeedService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name) private readonly menuModel: Model<MenuItemDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(Recipe.name) private readonly recipeModel: Model<RecipeDocument>,
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(SupplierReceipt.name)
    private readonly receiptModel: Model<SupplierReceiptDocument>,
    @InjectModel(StockTransferRequest.name)
    private readonly stockRequestModel: Model<StockTransferRequestDocument>,
    @InjectModel(ShiftSession.name)
    private readonly shiftModel: Model<ShiftSessionDocument>,
    @InjectModel(StockLot.name)
    private readonly lotModel: Model<StockLotDocument>,
    @InjectModel(PaymentMethodConfig.name)
    private readonly paymentModel: Model<PaymentMethodDocument>,
  ) {}

  /** Dữ liệu báo cáo demo-store — ghi thẳng MongoDB, idempotent theo SEED_VERSION */
  async seedReportData(tenantId: string): Promise<void> {
    const tid = new Types.ObjectId(tenantId);
    const marker = await this.stockRequestModel
      .findOne({ tenantId: tid, requestNumber: SEED_MARKER })
      .exec();
    if (marker?.note === SEED_VERSION) {
      const orderCount = await this.orderModel
        .countDocuments({
          tenantId: tid,
          $or: [
            { orderNumber: { $regex: `^${ORDER_PREFIX}` } },
            { orderNumber: { $regex: `^${LIVE_PREFIX}` } },
          ],
        })
        .exec();
      const targetTotal = HISTORY_DAYS * ORDERS_PER_DAY + 4;
      if (orderCount >= targetTotal) return;
    }

    await this.clearPreviousSeed(tid);
    this.logger.log('Seed luồng store đầy đủ — ghi dữ liệu mới vào DB…');

    await this.ensureStorePayments(tid);

    const today = new Date();
    const businessDate = today.toISOString().slice(0, 10);

    const [cashier, manager, owner, accounting, kitchen, warehouse, menu, warehouses] =
      await Promise.all([
      this.userModel.findOne({ tenantId: tid, role: Role.STAFF, isActive: true }).exec(),
      this.userModel
        .findOne({ tenantId: tid, role: Role.STORE_MANAGER, isActive: true })
        .exec(),
      this.userModel.findOne({ tenantId: tid, role: Role.ADMIN, isActive: true }).exec(),
      this.userModel.findOne({ tenantId: tid, role: Role.ACCOUNTING, isActive: true }).exec(),
      this.userModel.findOne({ tenantId: tid, role: Role.KITCHEN, isActive: true }).exec(),
      this.userModel.findOne({ tenantId: tid, role: Role.WAREHOUSE, isActive: true }).exec(),
      this.menuModel
        .find({
          tenantId: tid,
          isAvailable: true,
          name: { $regex: '^\\[Store\\]' },
        })
        .sort({ category: 1, name: 1 })
        .exec(),
      this.warehouseModel.find({ tenantId: tid }).exec(),
    ]);

    if (!cashier || menu.length < 3) {
      this.logger.warn('Bỏ qua seed báo cáo — thiếu thu ngân hoặc menu Store');
      return;
    }

    const whByCode = Object.fromEntries(warehouses.map((w) => [w.code, w]));
    const khoTong = whByCode.KHO_TONG;
    const kho1 = whByCode.KHO1;
    const kho2 = whByCode.KHO2;
    const kho3 = whByCode.KHO3;
    if (!khoTong || !kho1) {
      this.logger.warn('Bỏ qua seed báo cáo — thiếu kho');
      return;
    }

    const staffPick = (i: number) => {
      if (i % 7 === 0 && owner) return owner;
      if (i % 4 === 0 && manager) return manager;
      return cashier;
    };

    const statusPlan: OrderStatus[] = [
      ...Array(6).fill(OrderStatus.PENDING),
      ...Array(3).fill(OrderStatus.PREPARING),
      ...Array(2).fill(OrderStatus.READY),
      ...Array(2).fill(OrderStatus.CANCELLED),
      ...Array(ORDERS_PER_DAY - 13).fill(OrderStatus.COMPLETED),
    ];

    const shifts: WorkShift[] = [
      WorkShift.MORNING,
      WorkShift.MORNING,
      WorkShift.AFTERNOON,
      WorkShift.AFTERNOON,
      WorkShift.EVENING,
      WorkShift.EVENING,
      WorkShift.NIGHT,
    ];

    const shiftHours: Record<WorkShift, number> = {
      [WorkShift.MORNING]: 8,
      [WorkShift.AFTERNOON]: 13,
      [WorkShift.EVENING]: 18,
      [WorkShift.NIGHT]: 21,
    };

    const tables = [
      'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'Mang đi', 'Grab #2048',
      'B07', 'B08', 'ShopeeFood', 'B09', 'B10', 'Mang đi', 'B11', 'B12',
    ];

    const customers = [
      undefined,
      'Anh Minh',
      'Chị Lan',
      'Khách VIP',
      undefined,
      'Grab khách',
    ];

    const sugarIceVariants: { sugar?: number; ice?: number; note?: string }[] = [
      { sugar: 100, ice: 50 },
      { sugar: 50, ice: 100 },
      { sugar: 0, ice: 70, note: 'Ít ngọt' },
      { sugar: 75, ice: 75 },
      {},
      { sugar: 100, ice: 0, note: 'Không đá' },
    ];

    const cancelReasons = ['Khách đổi ý', 'Hết món', 'Nhập sai đơn'];

    const createdOrders: OrderDocument[] = [];
    let globalSeq = 1;

    for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset--) {
      const businessDay = new Date(today);
      businessDay.setDate(businessDay.getDate() - dayOffset);
      businessDay.setHours(0, 0, 0, 0);
      const dateKey = businessDay.toISOString().slice(0, 10).replace(/-/g, '');

      for (let i = 0; i < ORDERS_PER_DAY; i++) {
        const suffix = String(i + 1).padStart(3, '0');
        const staff = staffPick(globalSeq);
        const shift = shifts[i % shifts.length];
        const isToday = dayOffset === 0;
        const status = isToday
          ? statusPlan[i % statusPlan.length]
          : OrderStatus.COMPLETED;
        const variant = sugarIceVariants[globalSeq % sugarIceVariants.length];
        const itemA = menu[globalSeq % menu.length];
        const itemB = menu[(globalSeq + 2) % menu.length];

        const lines: Order['items'] = [
          {
            menuItemId: itemA._id,
            name: itemA.name.replace(/^\[Store\]\s*/i, ''),
            basePrice: itemA.price,
            toppings: [],
            price: itemA.price,
            quantity: 1 + (globalSeq % 2),
            sugarPercent: variant.sugar,
            icePercent: variant.ice,
            note: variant.note,
          },
        ];
        if (globalSeq % 3 !== 1) {
          lines.push({
            menuItemId: itemB._id,
            name: itemB.name.replace(/^\[Store\]\s*/i, ''),
            basePrice: itemB.price,
            toppings: [],
            price: itemB.price,
            quantity: 1,
          });
        }

        const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
        const createdAt = new Date(businessDay);
        const baseHour = shiftHours[shift];
        createdAt.setHours(baseHour + (i % 4), (globalSeq * 7) % 60, 0, 0);

        const paymentMethod =
          globalSeq % 6 === 0 ? 'BANK_TRANSFER' : globalSeq % 11 === 0 ? 'MOMO' : 'CASH';

        const isCancelled = status === OrderStatus.CANCELLED;
        const cancelledAt = isCancelled
          ? new Date(createdAt.getTime() + 120_000)
          : undefined;

        const order = await this.orderModel.create({
          tenantId: tid,
          orderNumber: `${ORDER_PREFIX}${dateKey}-${suffix}`,
          invoiceNumber: `${dateKey}${String(globalSeq).padStart(4, '0')}`,
          dailySequence: globalSeq,
          items: lines,
          tableNumber: tables[globalSeq % tables.length],
          customerName: customers[globalSeq % customers.length],
          paymentMethod,
          workShift: shift,
          staffId: staff._id,
          staffName: staff.fullName,
          subtotal,
          total: subtotal,
          status,
          inventoryDeducted: false,
          cancelReason: isCancelled ? cancelReasons[globalSeq % cancelReasons.length] : undefined,
          cancelledAt,
          createdAt,
          updatedAt: createdAt,
        });
        createdOrders.push(order);
        globalSeq += 1;
      }
    }

    await this.seedLiveOrders(tid, cashier, menu, today, globalSeq);

    await this.deductInventoryForOrders(tid, kho1._id, createdOrders);

    await this.seedSupplierReceipts(tid, khoTong, accounting, today);
    await this.seedStockVouchers(
      tid,
      { khoTong, kho1, kho2, kho3 },
      accounting,
      manager ?? cashier,
      businessDate,
      today,
    );
    await this.seedShiftSessions(tid, cashier, manager, kitchen, warehouse, today);

    await this.bootstrapStockLots(tid);

    const seedMilk = await this.ingredientModel.findOne({ tenantId: tid, name: 'Sữa tươi' }).exec();
    if (seedMilk) {
      await this.stockRequestModel.create({
        tenantId: tid,
        requestNumber: SEED_MARKER,
        type: StockRequestType.REPLENISH_FROM_CENTRAL,
        status: StockRequestStatus.COMPLETED,
        fromWarehouseId: khoTong._id,
        fromWarehouseCode: khoTong.code,
        fromWarehouseName: khoTong.name,
        toWarehouseId: kho1._id,
        toWarehouseCode: kho1.code,
        toWarehouseName: kho1.name,
        businessDate,
        note: SEED_VERSION,
        lines: [{ ingredientId: seedMilk._id, quantity: 1 }],
        requestedByName: 'Hệ thống',
        completedAt: today,
        returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
      });
    }

    this.logger.log(
      `Đã seed luồng store: ${createdOrders.length} đơn / ${HISTORY_DAYS} ngày, phiếu kho & NCC ngày ${businessDate}`,
    );
  }

  private async ensureStorePayments(tid: Types.ObjectId) {
    const momo = await this.paymentModel
      .findOne({ tenantId: tid, code: 'MOMO' })
      .exec();
    if (!momo) {
      await this.paymentModel.create({
        tenantId: tid,
        code: 'MOMO',
        label: 'Ví MoMo',
        isActive: true,
        sortOrder: 2,
      });
    }
  }

  /** Đơn live hôm nay — POS / KDS */
  private async seedLiveOrders(
    tid: Types.ObjectId,
    cashier: UserDocument,
    menu: MenuItemDocument[],
    today: Date,
    startSeq: number,
  ) {
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const samples: {
      suffix: string;
      items: MenuItemDocument[];
      status: OrderStatus;
      hour: number;
      table: string;
    }[] = [
      { suffix: '001', items: menu.slice(0, 2), status: OrderStatus.PENDING, hour: 8, table: 'B01' },
      { suffix: '002', items: [menu[0]], status: OrderStatus.PREPARING, hour: 9, table: 'B02' },
      { suffix: '003', items: menu.slice(1, 3), status: OrderStatus.READY, hour: 10, table: 'Mang đi' },
      { suffix: '004', items: [menu[2] ?? menu[0]], status: OrderStatus.PENDING, hour: 11, table: 'B03' },
    ];

    let seq = startSeq;
    for (const s of samples) {
      const lines = s.items.map((m) => ({
        menuItemId: m._id,
        name: m.name.replace(/^\[Store\]\s*/i, ''),
        basePrice: m.price,
        toppings: [],
        price: m.price,
        quantity: 1,
      }));
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      const createdAt = new Date(today);
      createdAt.setHours(s.hour, 20 + seq % 40, 0, 0);

      const order = await this.orderModel.create({
        tenantId: tid,
        orderNumber: `${LIVE_PREFIX}${s.suffix}`,
        invoiceNumber: `${datePrefix}${String(seq).padStart(4, '0')}`,
        dailySequence: seq,
        items: lines,
        tableNumber: s.table,
        paymentMethod: 'CASH',
        workShift: WorkShift.MORNING,
        staffId: cashier._id,
        staffName: cashier.fullName,
        subtotal,
        total: subtotal,
        status: s.status,
        inventoryDeducted: false,
        createdAt,
        updatedAt: createdAt,
      });

      if (s.status === OrderStatus.READY) {
        const kho1 = await this.warehouseModel.findOne({ tenantId: tid, code: 'KHO1' }).exec();
        if (kho1) {
          await this.deductInventoryForOrders(tid, kho1._id, [order]);
        }
      }
      seq += 1;
    }
  }

  /** Tạo lot HSD cho tồn enrich — một số lot sắp hết hạn để demo cảnh báo */
  private async bootstrapStockLots(tid: Types.ObjectId) {
    const existing = await this.lotModel.countDocuments({ tenantId: tid }).exec();
    if (existing > 0) {
      await this.lotModel.deleteMany({ tenantId: tid }).exec();
    }

    const [stocks, ingredients, warehouses] = await Promise.all([
      this.stockModel.find({ tenantId: tid, currentStock: { $gt: 0 } }).exec(),
      this.ingredientModel.find({ tenantId: tid }).exec(),
      this.warehouseModel.find({ tenantId: tid }).exec(),
    ]);
    const ingById = new Map(ingredients.map((i) => [i._id.toString(), i]));
    const whById = new Map(warehouses.map((w) => [w._id.toString(), w]));
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (const row of stocks) {
      const ing = ingById.get(row.ingredientId.toString());
      if (!ing?.shelfLifeDays || ing.shelfLifeDays <= 0) continue;

      const wh = whById.get(row.warehouseId.toString());
      const isKitchen = wh?.isKitchenSource;
      const isCentral = wh?.isCentralWarehouse;

      let daysUntilExpiry = ing.shelfLifeDays;
      if (isKitchen && ing.name.includes('Sữa')) {
        daysUntilExpiry = 2;
      } else if (isKitchen && ing.name.includes('Trân châu')) {
        daysUntilExpiry = 1;
      } else if (isCentral && ing.name.includes('Sữa')) {
        daysUntilExpiry = 4;
      }

      const expiry = new Date(today);
      expiry.setDate(expiry.getDate() + daysUntilExpiry);

      const olderQty = Math.floor(row.currentStock * 0.35);
      const newerQty = row.currentStock - olderQty;

      if (olderQty > 0) {
        const oldExpiry = new Date(today);
        oldExpiry.setDate(oldExpiry.getDate() + Math.max(1, daysUntilExpiry - 2));
        await this.lotModel.create({
          tenantId: tid,
          warehouseId: row.warehouseId,
          ingredientId: row.ingredientId,
          quantity: olderQty,
          expiryDate: oldExpiry,
          receivedAt: new Date(today.getTime() - 2 * 86_400_000),
        });
      }

      if (newerQty > 0) {
        await this.lotModel.create({
          tenantId: tid,
          warehouseId: row.warehouseId,
          ingredientId: row.ingredientId,
          quantity: newerQty,
          expiryDate: expiry,
          receivedAt: today,
        });
      }
    }

    this.logger.log(`Đã bootstrap ${stocks.length} dòng tồn → stock lots (HSD)`);
  }

  private async clearPreviousSeed(tid: Types.ObjectId) {
    const orderIds = await this.orderModel
      .find({
        tenantId: tid,
        $or: [
          { orderNumber: { $regex: '^STORE-RPT-' } },
          { orderNumber: { $regex: '^STORE-DEMO-' } },
        ],
      })
      .select('_id')
      .exec();
    const ids = orderIds.map((o) => o._id);

    await Promise.all([
      this.orderModel
        .deleteMany({
          tenantId: tid,
          $or: [
            { orderNumber: { $regex: '^STORE-RPT-' } },
            { orderNumber: { $regex: '^STORE-DEMO-' } },
            { orderNumber: { $regex: '^STORE-LIVE-' } },
          ],
        })
        .exec(),
      this.lotModel.deleteMany({ tenantId: tid }).exec(),
      this.movementModel
        .deleteMany({
          tenantId: tid,
          $or: [
            { note: { $regex: '^STORE-RPT' } },
            ...(ids.length ? [{ orderId: { $in: ids } }] : []),
          ],
        })
        .exec(),
      this.receiptModel
        .deleteMany({
          tenantId: tid,
          documentNumber: { $regex: '^STORE-RPT-' },
        })
        .exec(),
      this.stockRequestModel
        .deleteMany({
          tenantId: tid,
          requestNumber: { $regex: '^STORE-RPT-' },
        })
        .exec(),
    ]);

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    await this.shiftModel
      .deleteMany({
        tenantId: tid,
        startedAt: { $gte: dayStart, $lt: dayEnd },
        userName: {
          $in: ['Thu ngân', 'Quản lý ca', 'Bếp', 'Thủ kho'],
        },
      })
      .exec();
  }

  private async deductInventoryForOrders(
    tid: Types.ObjectId,
    kitchenWhId: Types.ObjectId,
    orders: OrderDocument[],
  ) {
    const ingredients = await this.ingredientModel.find({ tenantId: tid }).exec();
    const ingById = new Map(ingredients.map((i) => [i._id.toString(), i]));
    const now = new Date();

    for (const order of orders) {
      if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.READY) {
        continue;
      }

      const aggregated = new Map<string, number>();
      for (const item of order.items) {
        const recipe = await this.recipeModel
          .findOne({ tenantId: tid, menuItemId: item.menuItemId })
          .exec();
        if (!recipe?.lines?.length) continue;

        for (const line of recipe.lines) {
          const id = line.ingredientId.toString();
          const ing = ingById.get(id);
          const name = ing?.name?.toLowerCase() ?? '';
          let mult = 1;
          if (name.includes('đường')) mult = (item.sugarPercent ?? 100) / 100;
          if (name.includes('đá')) mult = (item.icePercent ?? 100) / 100;
          const need = line.quantity * item.quantity * mult;
          aggregated.set(id, (aggregated.get(id) ?? 0) + need);
        }
      }

      for (const [ingredientId, qty] of aggregated) {
        await this.applyStockChange(tid, kitchenWhId, ingredientId, -qty, {
          type: StockMovementType.ORDER_OUT,
          orderId: order._id,
          note: `STORE-RPT · Đơn #${order.orderNumber}`,
          movementDate: order.createdAt ?? now,
        });
      }

      order.inventoryDeducted = true;
      await order.save();
    }
  }

  private async seedSupplierReceipts(
    tid: Types.ObjectId,
    khoTong: WarehouseLocationDocument,
    accounting: UserDocument | null,
    today: Date,
  ) {
    const ingNames = [
      'Sữa tươi',
      'Trân châu đen',
      'Bột matcha',
      'Syrup đào',
      'Syrup vải',
      'Đường',
      'Sữa đặc',
      'Kem cheese',
    ];
    const ingMap = new Map<string, Types.ObjectId>();
    for (const name of ingNames) {
      const ing = await this.ingredientModel.findOne({ tenantId: tid, name }).exec();
      if (ing) ingMap.set(name, ing._id);
    }

    const morning = new Date(today);
    morning.setHours(7, 30, 0, 0);
    const afternoon = new Date(today);
    afternoon.setHours(14, 15, 0, 0);

    const batches: {
      docNo: string;
      supplier: string;
      at: Date;
      note: string;
      lines: { name: string; qty: number; price: number; expiryDays?: number }[];
    }[] = [
      {
        docNo: 'STORE-RPT-NCC-001',
        supplier: 'Cty CP Nguyên liệu Trà Sữa Miền Nam',
        at: morning,
        note: 'Nhập sáng — sữa & trân châu (có HSD)',
        lines: [
          { name: 'Sữa tươi', qty: 40_000, price: 32, expiryDays: 5 },
          { name: 'Trân châu đen', qty: 12_000, price: 85, expiryDays: 2 },
          { name: 'Đường', qty: 8_000, price: 22, expiryDays: 180 },
        ],
      },
      {
        docNo: 'STORE-RPT-NCC-002',
        supplier: 'NCC Syrup & Bột — Store Demo',
        at: afternoon,
        note: 'Nhập chiều — topping & matcha',
        lines: [
          { name: 'Bột matcha', qty: 2_500, price: 420_000, expiryDays: 120 },
          { name: 'Syrup đào', qty: 6_000, price: 95_000, expiryDays: 90 },
          { name: 'Syrup vải', qty: 5_000, price: 92_000, expiryDays: 90 },
        ],
      },
      {
        docNo: 'STORE-RPT-NCC-003',
        supplier: 'Vinamilk Foodservice',
        at: (() => {
          const d = new Date(today);
          d.setDate(d.getDate() - 2);
          d.setHours(6, 45, 0, 0);
          return d;
        })(),
        note: 'Nhập sữa đặc & kem cheese',
        lines: [
          { name: 'Sữa đặc', qty: 15_000, price: 27_000, expiryDays: 14 },
          { name: 'Kem cheese', qty: 2_000, price: 185_000, expiryDays: 7 },
        ],
      },
    ];

    for (const batch of batches) {
      const lines = batch.lines
        .map((l) => {
          const ingredientId = ingMap.get(l.name);
          if (!ingredientId) return null;
          const expiryDate = new Date(batch.at);
          expiryDate.setDate(expiryDate.getDate() + (l.expiryDays ?? 30));
          return { ingredientId, quantity: l.qty, unitPrice: l.price, expiryDate };
        })
        .filter(Boolean) as {
        ingredientId: Types.ObjectId;
        quantity: number;
        unitPrice: number;
        expiryDate: Date;
      }[];
      if (lines.length === 0) continue;

      const receipt = await this.receiptModel.create({
        tenantId: tid,
        supplierName: batch.supplier,
        documentNumber: batch.docNo,
        warehouseId: khoTong._id,
        warehouseCode: khoTong.code,
        warehouseName: khoTong.name,
        documentDate: batch.at,
        note: batch.note,
        lines: lines.map((l) => ({
          ingredientId: l.ingredientId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          expiryDate: l.expiryDate,
        })),
        createdBy: accounting?._id,
        createdByName: accounting?.fullName ?? 'Kế toán demo',
        createdAt: batch.at,
        updatedAt: batch.at,
      });

      for (const line of lines) {
        await this.applyStockChange(
          tid,
          khoTong._id,
          line.ingredientId.toString(),
          line.quantity,
          {
            type: StockMovementType.SUPPLIER_IN,
            supplierReceiptId: receipt._id,
            note: `STORE-RPT · ${batch.docNo}`,
            movementDate: batch.at,
            expiryDate: line.expiryDate,
          },
        );
      }
    }
  }

  private async seedStockVouchers(
    tid: Types.ObjectId,
    wh: {
      khoTong: WarehouseLocationDocument;
      kho1: WarehouseLocationDocument;
      kho2?: WarehouseLocationDocument;
      kho3?: WarehouseLocationDocument;
    },
    accounting: UserDocument | null,
    requester: UserDocument,
    businessDate: string,
    today: Date,
  ) {
    const pickIng = async (name: string) => {
      const doc = await this.ingredientModel.findOne({ tenantId: tid, name }).exec();
      return doc?._id;
    };

    const milk = await pickIng('Sữa tươi');
    const tea = await pickIng('Nước trà đen (pha sẵn)');
    const pearl = await pickIng('Trân châu đen');
    const matcha = await pickIng('Bột matcha');
    const syrup = await pickIng('Syrup vải');
    if (!milk || !tea) return;

    const morning = new Date(today);
    morning.setHours(7, 0, 0, 0);

    const dispatch1 = await this.stockRequestModel.create({
      tenantId: tid,
      requestNumber: 'STORE-RPT-CP-001',
      type: StockRequestType.DISPATCH_FROM_CENTRAL,
      status: StockRequestStatus.COMPLETED,
      fromWarehouseId: wh.khoTong._id,
      fromWarehouseCode: wh.khoTong.code,
      fromWarehouseName: wh.khoTong.name,
      toWarehouseId: wh.kho1._id,
      toWarehouseCode: wh.kho1.code,
      toWarehouseName: wh.kho1.name,
      permitDocumentNumber: 'CT-2026-0618',
      permitDocumentDate: today,
      purpose: 'Cấp phát đầu ca bếp (KHO1)',
      note: 'STORE-RPT · Phiếu cấp phát sáng',
      businessDate,
      lines: [
        { ingredientId: milk, quantity: 25_000 },
        { ingredientId: tea, quantity: 20_000 },
        ...(pearl ? [{ ingredientId: pearl, quantity: 4_000 }] : []),
      ],
      requestedBy: requester._id,
      requestedByName: requester.fullName,
      submittedAt: morning,
      reviewedBy: accounting?._id,
      reviewedByName: accounting?.fullName ?? 'Kế toán',
      reviewedAt: new Date(morning.getTime() + 30 * 60_000),
      accountingNote: 'Duyệt cấp phát ca sáng',
      completedAt: new Date(morning.getTime() + 35 * 60_000),
      returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
      createdAt: morning,
      updatedAt: morning,
    });

    await this.transferStock(
      tid,
      wh.khoTong._id,
      wh.kho1._id,
      [
        { ingredientId: milk, qty: 25_000 },
        { ingredientId: tea, qty: 20_000 },
        ...(pearl ? [{ ingredientId: pearl, qty: 4_000 }] : []),
      ],
      dispatch1._id,
      morning,
    );

    await this.stockRequestModel.create({
      tenantId: tid,
      requestNumber: 'STORE-RPT-HT-001',
      type: StockRequestType.RETURN_TO_CENTRAL,
      status: StockRequestStatus.PENDING,
      fromWarehouseId: wh.kho1._id,
      fromWarehouseCode: wh.kho1.code,
      fromWarehouseName: wh.kho1.name,
      toWarehouseId: wh.khoTong._id,
      toWarehouseCode: wh.khoTong.code,
      toWarehouseName: wh.khoTong.name,
      parentRequestId: dispatch1._id,
      parentRequestNumber: dispatch1.requestNumber,
      permitDocumentNumber: 'HT-2026-0618',
      permitDocumentDate: today,
      purpose: 'Thu hồi về kho tổng (tuỳ chọn) — chờ duyệt',
      note: 'STORE-RPT · Hoàn phần còn lại',
      businessDate,
      lines: [
        { ingredientId: milk, quantity: 6_000 },
        { ingredientId: tea, quantity: 4_500 },
      ],
      requestedBy: requester._id,
      requestedByName: requester.fullName,
      submittedAt: (() => {
        const t = new Date(today);
        t.setHours(20, 30, 0, 0);
        return t;
      })(),
      returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
    });

    if (wh.kho2 && matcha) {
      const noon = new Date(today);
      noon.setHours(12, 0, 0, 0);
      const dispatch2 = await this.stockRequestModel.create({
        tenantId: tid,
        requestNumber: 'STORE-RPT-CP-002',
        type: StockRequestType.DISPATCH_FROM_CENTRAL,
        status: StockRequestStatus.COMPLETED,
        fromWarehouseId: wh.khoTong._id,
        fromWarehouseCode: wh.khoTong.code,
        fromWarehouseName: wh.khoTong.name,
        toWarehouseId: wh.kho2._id,
        toWarehouseCode: wh.kho2.code,
        toWarehouseName: wh.kho2.name,
        permitDocumentNumber: 'CT-2026-0619',
        permitDocumentDate: today,
        purpose: 'Cấp phát KHO2 — pha chế',
        businessDate,
        lines: [{ ingredientId: matcha, quantity: 1_800 }],
        requestedBy: requester._id,
        requestedByName: requester.fullName,
        reviewedBy: accounting?._id,
        reviewedByName: accounting?.fullName,
        completedAt: noon,
        returnClosureStatus: ReturnClosureStatus.CLOSED,
        createdAt: noon,
      });

      await this.transferStock(
        tid,
        wh.khoTong._id,
        wh.kho2._id,
        [{ ingredientId: matcha, qty: 1_800 }],
        dispatch2._id,
        noon,
      );
    }

    if (wh.kho3 && syrup) {
      const replenishAt = new Date(today);
      replenishAt.setHours(15, 0, 0, 0);
      const replenishReq = await this.stockRequestModel.create({
        tenantId: tid,
        requestNumber: 'STORE-RPT-BO-001',
        type: StockRequestType.REPLENISH_FROM_CENTRAL,
        status: StockRequestStatus.COMPLETED,
        fromWarehouseId: wh.khoTong._id,
        fromWarehouseCode: wh.khoTong.code,
        fromWarehouseName: wh.khoTong.name,
        toWarehouseId: wh.kho3._id,
        toWarehouseCode: wh.kho3.code,
        toWarehouseName: wh.kho3.name,
        permitDocumentNumber: 'BS-2026-0620',
        permitDocumentDate: today,
        purpose: 'Bổ sung syrup kho lạnh',
        businessDate,
        lines: [{ ingredientId: syrup, quantity: 5_000 }],
        requestedBy: requester._id,
        requestedByName: requester.fullName,
        submittedAt: replenishAt,
        reviewedBy: accounting?._id,
        reviewedByName: accounting?.fullName ?? 'Kế toán',
        reviewedAt: new Date(replenishAt.getTime() + 20 * 60_000),
        completedAt: new Date(replenishAt.getTime() + 25 * 60_000),
        returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
      });

      await this.transferStock(
        tid,
        wh.khoTong._id,
        wh.kho3._id,
        [{ ingredientId: syrup, qty: 5_000 }],
        replenishReq._id,
        replenishAt,
      );

      await this.stockRequestModel.create({
        tenantId: tid,
        requestNumber: 'STORE-RPT-BO-002',
        type: StockRequestType.REPLENISH_FROM_CENTRAL,
        status: StockRequestStatus.PENDING,
        fromWarehouseId: wh.khoTong._id,
        fromWarehouseCode: wh.khoTong.code,
        fromWarehouseName: wh.khoTong.name,
        toWarehouseId: wh.kho1._id,
        toWarehouseCode: wh.kho1.code,
        toWarehouseName: wh.kho1.name,
        permitDocumentNumber: 'BS-2026-0621',
        purpose: 'Bổ sung trân châu KHO1 — chờ duyệt',
        businessDate,
        lines: pearl ? [{ ingredientId: pearl, quantity: 3_000 }] : [],
        requestedBy: requester._id,
        requestedByName: requester.fullName,
        submittedAt: (() => {
          const t = new Date(today);
          t.setHours(16, 30, 0, 0);
          return t;
        })(),
        returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
      });
    }
  }

  private async transferStock(
    tid: Types.ObjectId,
    fromId: Types.ObjectId,
    toId: Types.ObjectId,
    lines: { ingredientId: Types.ObjectId; qty: number }[],
    requestId: Types.ObjectId,
    at: Date,
  ) {
    for (const line of lines) {
      const id = line.ingredientId.toString();
      const slices = await this.consumeLotsFIFO(tid, fromId, id, line.qty);
      await this.applyStockChange(tid, fromId, id, -line.qty, {
        type: StockMovementType.TRANSFER_OUT,
        stockRequestId: requestId,
        note: 'STORE-RPT · Chuyển kho đi',
        movementDate: at,
      }, true);
      for (const slice of slices) {
        await this.applyStockChange(tid, toId, id, slice.quantity, {
          type: StockMovementType.TRANSFER_IN,
          stockRequestId: requestId,
          note: 'STORE-RPT · Chuyển kho đến',
          movementDate: at,
          expiryDate: slice.expiryDate,
        }, true);
      }
    }
  }

  private async seedShiftSessions(
    tid: Types.ObjectId,
    cashier: UserDocument,
    manager: UserDocument | null,
    kitchen: UserDocument | null,
    warehouse: UserDocument | null,
    today: Date,
  ) {
    const morningStart = new Date(today);
    morningStart.setHours(7, 0, 0, 0);
    const morningEnd = new Date(today);
    morningEnd.setHours(12, 0, 0, 0);
    const afternoonStart = new Date(today);
    afternoonStart.setHours(12, 0, 0, 0);

    await this.shiftModel.create({
      tenantId: tid,
      userId: cashier._id,
      userName: cashier.fullName,
      role: cashier.role,
      workShift: WorkShift.MORNING,
      startedAt: morningStart,
      endedAt: morningEnd,
    });

    await this.shiftModel.create({
      tenantId: tid,
      userId: cashier._id,
      userName: cashier.fullName,
      role: cashier.role,
      workShift: WorkShift.AFTERNOON,
      startedAt: afternoonStart,
    });

    if (manager) {
      const mgrStart = new Date(today);
      mgrStart.setHours(7, 30, 0, 0);
      const mgrEnd = new Date(today);
      mgrEnd.setHours(17, 0, 0, 0);
      await this.shiftModel.create({
        tenantId: tid,
        userId: manager._id,
        userName: manager.fullName,
        role: manager.role,
        workShift: WorkShift.MORNING,
        startedAt: mgrStart,
        endedAt: mgrEnd,
      });
    }

    if (kitchen) {
      const kStart = new Date(today);
      kStart.setHours(7, 15, 0, 0);
      await this.shiftModel.create({
        tenantId: tid,
        userId: kitchen._id,
        userName: kitchen.fullName,
        role: kitchen.role,
        workShift: WorkShift.MORNING,
        startedAt: kStart,
      });
    }

    if (warehouse) {
      const wStart = new Date(today);
      wStart.setHours(6, 30, 0, 0);
      const wEnd = new Date(today);
      wEnd.setHours(14, 0, 0, 0);
      await this.shiftModel.create({
        tenantId: tid,
        userId: warehouse._id,
        userName: warehouse.fullName,
        role: warehouse.role,
        workShift: WorkShift.MORNING,
        startedAt: wStart,
        endedAt: wEnd,
      });
    }
  }

  private async consumeLotsFIFO(
    tid: Types.ObjectId,
    warehouseId: Types.ObjectId,
    ingredientId: string,
    qty: number,
  ): Promise<{ quantity: number; expiryDate?: Date }[]> {
    const lots = await this.lotModel
      .find({
        tenantId: tid,
        warehouseId,
        ingredientId: new Types.ObjectId(ingredientId),
        quantity: { $gt: 0 },
      })
      .sort({ expiryDate: 1, receivedAt: 1 })
      .exec();

    const slices: { quantity: number; expiryDate?: Date }[] = [];
    let remaining = qty;

    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.quantity, remaining);
      lot.quantity -= take;
      await lot.save();
      remaining -= take;
      slices.push({ quantity: take, expiryDate: lot.expiryDate });
    }

    if (remaining > 0) {
      slices.push({ quantity: remaining, expiryDate: undefined });
    }

    return slices;
  }

  private async applyStockChange(
    tid: Types.ObjectId,
    warehouseId: Types.ObjectId,
    ingredientId: string,
    delta: number,
    meta: {
      type: StockMovementType;
      orderId?: Types.ObjectId;
      supplierReceiptId?: Types.ObjectId;
      stockRequestId?: Types.ObjectId;
      note?: string;
      movementDate?: Date;
      expiryDate?: Date;
    },
    skipLotConsume = false,
  ) {
    if (delta < 0 && !skipLotConsume) {
      await this.consumeLotsFIFO(tid, warehouseId, ingredientId, Math.abs(delta));
    }

    const row = await this.stockModel
      .findOne({ tenantId: tid, warehouseId, ingredientId: new Types.ObjectId(ingredientId) })
      .exec();
    if (!row) return;

    const next = row.currentStock + delta;
    if (next < 0) return;

    row.currentStock = next;
    await row.save();

    const rows = await this.stockModel
      .find({ tenantId: tid, ingredientId: new Types.ObjectId(ingredientId) })
      .exec();
    const total = rows.reduce((s, r) => s + r.currentStock, 0);
    await this.ingredientModel
      .updateOne({ _id: ingredientId }, { $set: { currentStock: total } })
      .exec();

    if (delta > 0 && meta.expiryDate) {
      await this.lotModel.create({
        tenantId: tid,
        warehouseId,
        ingredientId: new Types.ObjectId(ingredientId),
        quantity: delta,
        expiryDate: meta.expiryDate,
        supplierReceiptId: meta.supplierReceiptId,
        stockRequestId: meta.stockRequestId,
        receivedAt: meta.movementDate ?? new Date(),
      });
    }

    await this.movementModel.create({
      tenantId: tid,
      warehouseId,
      ingredientId: new Types.ObjectId(ingredientId),
      type: meta.type,
      quantity: delta,
      balanceAfter: next,
      orderId: meta.orderId,
      supplierReceiptId: meta.supplierReceiptId,
      stockRequestId: meta.stockRequestId,
      note: meta.note,
      movementDate: meta.movementDate ?? new Date(),
      createdAt: meta.movementDate ?? new Date(),
    });
  }
}
