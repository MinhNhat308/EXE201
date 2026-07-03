import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  isPendingStatus,
  normalizeOrderStatus,
  OrderStatus,
} from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums/role.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { WorkShift } from '../../common/enums/work-shift.enum';
import {
  formatDatePrefixInTimezone,
  getDayRangeInTimezone,
} from '../../common/utils/day-range';
import { getTenantId } from '../../common/tenant/tenant-context';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import type { TodayReportResponse } from './dto/today-report.dto';
import { InventoryService } from '../inventory/inventory.service';
import { TenantsService } from '../tenants/tenants.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateKitchenStatusDto } from './dto/update-kitchen-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { UserDocument } from '../users/schemas/user.schema';

const ACTIVE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.CONFIRMED,
  OrderStatus.SERVING,
];

const KITCHEN_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.SERVING]: [OrderStatus.READY],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly tenantsService: TenantsService,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService,
  ) {}

  private async maybeDeductInventory(order: OrderDocument): Promise<void> {
    if (!order.tenantId) return;
    const tenant = await this.tenantsService.findById(order.tenantId.toString());
    if (tenant.settings?.trackInventory === false) return;
    await this.inventoryService.deductForOrder(order._id.toString());
  }

  private async resolveStoreTimezone(): Promise<string> {
    const tenantId = getTenantId();
    if (!tenantId) return 'Asia/Ho_Chi_Minh';
    try {
      const tenant = await this.tenantsService.findById(tenantId);
      return tenant.settings?.timezone ?? 'Asia/Ho_Chi_Minh';
    } catch {
      return 'Asia/Ho_Chi_Minh';
    }
  }

  private async getTodayRange() {
    const timezone = await this.resolveStoreTimezone();
    return getDayRangeInTimezone(timezone);
  }

  private async isSoloTenant(tenantId?: Types.ObjectId): Promise<boolean> {
    if (!tenantId) return false;
    try {
      const tenant = await this.tenantsService.findById(tenantId.toString());
      return tenant.intendedPlan === SubscriptionPlan.SOLO;
    } catch {
      return false;
    }
  }

  private async generateDailyNumbers(): Promise<{
    invoiceNumber: string;
    orderNumber: string;
    dailySequence: number;
  }> {
    const timezone = await this.resolveStoreTimezone();
    const datePrefix = formatDatePrefixInTimezone(timezone);

    const countersColl = this.orderModel.db.collection('order_counters');
    const key = `orders:${datePrefix}`;

    const { start, end } = await this.getTodayRange();
    const existingCount = await this.orderModel.countDocuments({
      createdAt: { $gte: start, $lt: end },
    });

    // Use an update pipeline so we can atomically set seq = (existing seq || existingCount) + 1
    const res = await countersColl.findOneAndUpdate(
      { _id: key as any },
      [
        {
          $set: {
            seq: { $add: [{ $ifNull: ['$seq', existingCount] }, 1] },
            createdAt: { $ifNull: ['$createdAt', new Date()] },
          },
        },
      ],
      { upsert: true, returnDocument: 'after' } as any,
    );

    const seq = (res.value && res.value.seq) || 1;
    console.log('[OrdersService] generateDailyNumbers', { datePrefix, seq });
    const seqStr = String(seq).padStart(2, '0');
    const shortSuffix = new Types.ObjectId().toString().slice(-4);

    return {
      invoiceNumber: `${datePrefix}${seqStr}${shortSuffix}`,
      // make orderNumber globally unique by including date prefix and suffix
      orderNumber: `${datePrefix}${seqStr}${shortSuffix}`,
      dailySequence: seq,
    };
  }

  private async formatDatePrefix(): Promise<string> {
    const timezone = await this.resolveStoreTimezone();
    return formatDatePrefixInTimezone(timezone);
  }

  private async bumpCounter(): Promise<{ invoiceNumber: string; orderNumber: string; dailySequence: number }> {
    const datePrefix = await this.formatDatePrefix();
    const countersColl = this.orderModel.db.collection('order_counters');
    const key = `orders:${datePrefix}`;

    const res = await countersColl.findOneAndUpdate(
      { _id: key as any },
      { $inc: { seq: 1 }, $setOnInsert: { createdAt: new Date() } } as any,
      { upsert: true, returnDocument: 'after' } as any,
    );
    const seq = (res.value && res.value.seq) || 1;
    const seqStr = String(seq).padStart(2, '0');
    const shortSuffix = new Types.ObjectId().toString().slice(-4);
    console.log('[OrdersService] bumpCounter', { datePrefix, seq, shortSuffix });
    return {
      invoiceNumber: `${datePrefix}${seqStr}${shortSuffix}`,
      orderNumber: `${datePrefix}${seqStr}${shortSuffix}`,
      dailySequence: seq,
    };
  }

  /** Store/Chain: thu ngân tạo đơn PENDING → bếp → phục vụ giao */
  async create(
    createOrderDto: CreateOrderDto,
    staff: UserDocument,
  ): Promise<OrderDocument> {
    return this.saveNewOrder(createOrderDto, staff, OrderStatus.PENDING);
  }

  /** Solo — hoàn tất đơn từ màn Hóa đơn & doanh thu (PENDING → COMPLETED) */
  async completeSoloSale(
    id: string,
    staff: UserDocument,
  ): Promise<OrderDocument> {
    if (staff.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ chủ cửa hàng mới hoàn tất đơn Solo');
    }
    const solo = await this.isSoloTenant(staff.tenantId);
    if (!solo) {
      throw new ForbiddenException('Chỉ dùng cho cửa hàng gói Solo');
    }

    const order = await this.findById(id);
    const current = normalizeOrderStatus(order.status);

    if (current === OrderStatus.COMPLETED) {
      return order;
    }
    if (current === OrderStatus.CANCELLED) {
      throw new BadRequestException('Không thể hoàn tất đơn đã hủy');
    }
    if (current !== OrderStatus.PENDING && current !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        'Đơn Solo chỉ hoàn tất từ trạng thái chờ xử lý',
      );
    }

    order.status = OrderStatus.COMPLETED;
    const saved = await order.save();
    await this.maybeDeductInventory(saved);
    return saved;
  }

  private async saveNewOrder(
    createOrderDto: CreateOrderDto,
    staff: UserDocument,
    status: OrderStatus,
  ): Promise<OrderDocument> {
    const payment = await this.paymentMethodsService.findByCode(
      createOrderDto.paymentMethod,
    );
    if (!payment) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    let { orderNumber: ord, invoiceNumber: inv, dailySequence: seq } =
      await this.generateDailyNumbers();

    const tableNumber = createOrderDto.tableNumber?.trim() || ord;

    const buildOrder = (ordNum: string, invNum: string, dailySeq: number) =>
      new this.orderModel({
        ...createOrderDto,
        tableNumber,
        orderNumber: ordNum,
        invoiceNumber: invNum,
        dailySequence: dailySeq,
        staffId: staff._id,
        staffName: staff.fullName,
        branchId:
          createOrderDto.branchId != null
            ? new Types.ObjectId(createOrderDto.branchId)
            : staff.branchId,
        status,
        items: createOrderDto.items.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          basePrice: item.basePrice,
          toppings: item.toppings ?? [],
          price: item.price,
          quantity: item.quantity,
          note: item.note,
          sugarPercent: item.sugarPercent,
          icePercent: item.icePercent,
        })),
      });

    const maxRetries = 3;
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < maxRetries) {
      attempt += 1;
      const currentOrder = buildOrder(ord, inv, seq);
      try {
        return await currentOrder.save();
      } catch (err: any) {
        lastError = err;
        const isDupOrderNumber =
          err && err.code === 11000 && err.keyValue && err.keyValue.orderNumber;
        if (!isDupOrderNumber) break;

        const regenerated = await this.bumpCounter();
        ord = regenerated.orderNumber;
        inv = regenerated.invoiceNumber;
        seq = regenerated.dailySequence;
      }
    }

    throw lastError;
  }

  async findToday(
    workShift?: WorkShift,
    activeOnly = false,
    branchId?: string,
  ): Promise<OrderDocument[]> {
    const { start, end } = await this.getTodayRange();
    const filter: Record<string, unknown> = {
      createdAt: { $gte: start, $lt: end },
    };

    if (workShift) filter.workShift = workShift;
    if (activeOnly) {
      filter.status = { $in: ACTIVE_STATUSES };
    }
    if (branchId) {
      filter.branchId = new Types.ObjectId(branchId);
    }

    return this.orderModel
      .find(filter)
      .sort({ dailySequence: 1, createdAt: -1 })
      .exec();
  }

  async getTodayReport(workShift?: WorkShift): Promise<TodayReportResponse> {
    const orders = await this.findToday(workShift);
    const byShift: TodayReportResponse['byShift'] = {};
    for (const shift of Object.values(WorkShift)) {
      byShift[shift] = {
        count: 0,
        paid: 0,
        completed: 0,
        revenue: 0,
        servedRevenue: 0,
      };
    }

    const byStatus: TodayReportResponse['byStatus'] = {
      [OrderStatus.PENDING]: { count: 0, revenue: 0 },
      [OrderStatus.PREPARING]: { count: 0, revenue: 0 },
      [OrderStatus.READY]: { count: 0, revenue: 0 },
      [OrderStatus.COMPLETED]: { count: 0, revenue: 0 },
      [OrderStatus.CANCELLED]: { count: 0, revenue: 0 },
    };

    const byPaymentMethod: TodayReportResponse['byPaymentMethod'] = {};
    const itemCounts = new Map<string, number>();

    let paidCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let pendingCount = 0;
    let preparingCount = 0;
    let readyCount = 0;
    let revenue = 0;
    let servedRevenue = 0;
    let cashTotal = 0;
    let bankTotal = 0;

    for (const o of orders) {
      const shift = o.workShift as WorkShift;
      const status = normalizeOrderStatus(o.status);
      const total = o.total ?? 0;
      const isCancelled = status === OrderStatus.CANCELLED;
      const isPaid = !isCancelled;
      const isCompleted = status === OrderStatus.COMPLETED;

      if (byShift[shift]) {
        byShift[shift].count += 1;
      }

      if (byStatus[status]) {
        byStatus[status].count += 1;
        if (isPaid) byStatus[status].revenue += total;
      }

      if (isCancelled) {
        cancelledCount += 1;
        continue;
      }

      paidCount += 1;
      revenue += total;

      if (byShift[shift]) {
        byShift[shift].paid += 1;
        byShift[shift].revenue += total;
      }

      const pm = o.paymentMethod ?? 'OTHER';
      if (!byPaymentMethod[pm]) {
        byPaymentMethod[pm] = { count: 0, total: 0 };
      }
      byPaymentMethod[pm].count += 1;
      byPaymentMethod[pm].total += total;

      if (pm === 'CASH') cashTotal += total;
      if (pm === 'BANK_TRANSFER') bankTotal += total;

      for (const line of o.items ?? []) {
        itemCounts.set(line.name, (itemCounts.get(line.name) ?? 0) + line.quantity);
      }

      if (status === OrderStatus.PENDING) pendingCount += 1;
      else if (status === OrderStatus.PREPARING) preparingCount += 1;
      else if (status === OrderStatus.READY) readyCount += 1;

      if (isCompleted) {
        completedCount += 1;
        servedRevenue += total;
        if (byShift[shift]) {
          byShift[shift].completed += 1;
          byShift[shift].servedRevenue += total;
        }
      }
    }

    const topItems = [...itemCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, quantity]) => ({ name, quantity }));

    return {
      orderCount: orders.length,
      paidCount,
      completedCount,
      cancelledCount,
      pendingCount,
      preparingCount,
      readyCount,
      revenue,
      servedRevenue,
      averageTicket: paidCount > 0 ? Math.round(revenue / paidCount) : 0,
      cashTotal,
      bankTotal,
      byShift,
      byStatus,
      byPaymentMethod,
      topItems,
    };
  }

  async findActiveForServer(workShift?: WorkShift): Promise<OrderDocument[]> {
    const filter: Record<string, unknown> = {
      status: {
        $in: [OrderStatus.READY, OrderStatus.PREPARING, OrderStatus.SERVING],
      },
    };
    if (workShift) filter.workShift = workShift;
    return this.orderModel
      .find(filter)
      .sort({ dailySequence: 1 })
      .exec();
  }

  async findByShift(workShift: WorkShift): Promise<OrderDocument[]> {
    return this.findToday(workShift, true);
  }

  async updateByCashier(
    id: string,
    dto: UpdateOrderDto,
  ): Promise<OrderDocument> {
    const order = await this.findById(id);

    if (!isPendingStatus(order.status)) {
      throw new ForbiddenException(
        'Chỉ sửa được đơn ở trạng thái "Chưa thực hiện"',
      );
    }

    if (dto.items) {
      order.items = dto.items.map((item) => ({
        menuItemId: new Types.ObjectId(item.menuItemId),
        name: item.name,
        basePrice: item.basePrice,
        toppings: item.toppings ?? [],
        price: item.price,
        quantity: item.quantity,
        note: item.note,
        sugarPercent: item.sugarPercent,
        icePercent: item.icePercent,
      }));
    }

    if (dto.customerName !== undefined) order.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) order.customerPhone = dto.customerPhone;
    if (dto.tableNumber !== undefined) order.tableNumber = dto.tableNumber;
    if (dto.note !== undefined) order.note = dto.note;
    if (dto.subtotal !== undefined) order.subtotal = dto.subtotal;
    if (dto.total !== undefined) order.total = dto.total;

    return order.save();
  }

  async cancel(id: string, dto: CancelOrderDto): Promise<OrderDocument> {
    const order = await this.findById(id);

    if (!isPendingStatus(order.status)) {
      throw new ForbiddenException(
        'Chỉ hủy được đơn ở trạng thái "Chưa thực hiện"',
      );
    }

    if (order.paymentMethod === 'BANK_TRANSFER') {
      throw new BadRequestException(
        'Đơn chuyển khoản không thể hủy vì không hoàn tiền được',
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelReason = dto.cancelReason;
    order.cancelledAt = new Date();
    return order.save();
  }

  async updateKitchenStatus(
    id: string,
    dto: UpdateKitchenStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.findById(id);
    const current = normalizeOrderStatus(order.status);
    const next = normalizeOrderStatus(dto.status);

    const allowed = KITCHEN_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Không thể chuyển từ "${current}" sang "${next}"`,
      );
    }

    order.status = next;
    const saved = await order.save();

    if (next === OrderStatus.READY) {
      await this.maybeDeductInventory(saved);
    }

    return saved;
  }

  /** Store/Chain — phục vụ: READY → COMPLETED (sau khi bếp xong) */
  async updateStatus(id: string, status: OrderStatus): Promise<OrderDocument> {
    const order = await this.findById(id);
    const current = normalizeOrderStatus(order.status);
    const next = normalizeOrderStatus(status);

    if (next === OrderStatus.COMPLETED) {
      if (current === OrderStatus.COMPLETED) {
        return order;
      }
      if (current === OrderStatus.CANCELLED) {
        throw new BadRequestException('Không thể hoàn tất đơn đã hủy');
      }
      if (current !== OrderStatus.READY) {
        throw new BadRequestException(
          'Chỉ giao được đơn ở trạng thái READY (bếp đã xong)',
        );
      }
    }

    order.status = next;
    const saved = await order.save();

    if (next === OrderStatus.COMPLETED || next === OrderStatus.READY) {
      await this.maybeDeductInventory(saved);
    }

    return saved;
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }
}
