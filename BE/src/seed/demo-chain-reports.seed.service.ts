import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';
import { WorkShift } from '../common/enums/work-shift.enum';
import { Branch, BranchDocument } from '../modules/branches/schemas/branch.schema';
import { MenuItem, MenuItemDocument } from '../modules/menu/schemas/menu-item.schema';
import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';
import { User, UserDocument } from '../modules/users/schemas/user.schema';

const ORDER_PREFIX = 'CHAIN-RPT-';
const HISTORY_DAYS = 7;
const ORDERS_PER_DAY = 6;

@Injectable()
export class DemoChainReportsSeedService {
  private readonly logger = new Logger(DemoChainReportsSeedService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name) private readonly menuModel: Model<MenuItemDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
  ) {}

  async seedChainReportData(tenantId: string): Promise<void> {
    const tid = new Types.ObjectId(tenantId);
    const exists = await this.orderModel
      .countDocuments({ tenantId: tid, orderNumber: { $regex: `^${ORDER_PREFIX}` } })
      .exec();
    if (exists >= HISTORY_DAYS * ORDERS_PER_DAY * 3) return;

    await this.orderModel
      .deleteMany({ tenantId: tid, orderNumber: { $regex: `^${ORDER_PREFIX}` } })
      .exec();

    this.logger.log('Seed báo cáo chuỗi — ghi đơn theo chi nhánh…');

    const [branches, menu, staffUsers] = await Promise.all([
      this.branchModel.find({ tenantId: tid, isActive: true }).sort({ code: 1 }).exec(),
      this.menuModel
        .find({ tenantId: tid, isAvailable: true, name: /^\[Chain\]/ })
        .sort({ name: 1 })
        .exec(),
      this.userModel
        .find({
          tenantId: tid,
          role: { $in: [Role.STAFF, Role.ADMIN, Role.STORE_MANAGER] },
          isActive: true,
        })
        .exec(),
    ]);

    if (branches.length < 2 || menu.length < 3) {
      this.logger.warn('Bỏ qua seed chain — thiếu chi nhánh hoặc menu');
      return;
    }

    const today = new Date();
    let globalSeq = 1;

    const shifts = [WorkShift.MORNING, WorkShift.AFTERNOON, WorkShift.EVENING];
    const tables = ['B01', 'B02', 'Mang đi', 'Grab', 'ShopeeFood'];

    for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset--) {
      const businessDay = new Date(today);
      businessDay.setDate(businessDay.getDate() - dayOffset);
      const dateKey = businessDay.toISOString().slice(0, 10).replace(/-/g, '');

      for (const branch of branches) {
        const branchStaff =
          staffUsers.find((u) => u.branchId?.equals(branch._id)) ??
          staffUsers[globalSeq % staffUsers.length];

        for (let i = 0; i < ORDERS_PER_DAY; i++) {
          const itemA = menu[(globalSeq + i) % menu.length];
          const itemB = menu[(globalSeq + i + 2) % menu.length];
          const lines = [
            {
              menuItemId: itemA._id,
              name: itemA.name.replace(/^\[Chain\]\s*/i, ''),
              basePrice: itemA.price,
              toppings: [],
              price: itemA.price,
              quantity: 1 + (i % 2),
            },
          ];
          if (i % 2 === 0) {
            lines.push({
              menuItemId: itemB._id,
              name: itemB.name.replace(/^\[Chain\]\s*/i, ''),
              basePrice: itemB.price,
              toppings: [],
              price: itemB.price,
              quantity: 1,
            });
          }

          const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
          const createdAt = new Date(businessDay);
          const shift = shifts[i % shifts.length];
          createdAt.setHours(8 + (i % 10), (globalSeq * 5) % 60, 0, 0);

          const isToday = dayOffset === 0;
          const status = isToday && i < 2
            ? OrderStatus.PENDING
            : isToday && i === 2
              ? OrderStatus.PREPARING
              : OrderStatus.COMPLETED;

          await this.orderModel.create({
            tenantId: tid,
            branchId: branch._id,
            orderNumber: `${ORDER_PREFIX}${branch.code}-${dateKey}-${String(i + 1).padStart(2, '0')}`,
            invoiceNumber: `${dateKey}${String(globalSeq).padStart(4, '0')}`,
            dailySequence: globalSeq,
            items: lines,
            tableNumber: tables[(globalSeq + i) % tables.length],
            paymentMethod: globalSeq % 5 === 0 ? 'BANK_TRANSFER' : 'CASH',
            workShift: shift,
            staffId: branchStaff._id,
            staffName: branchStaff.fullName,
            subtotal,
            total: subtotal,
            status,
            inventoryDeducted: status === OrderStatus.COMPLETED,
            createdAt,
            updatedAt: createdAt,
          });
          globalSeq += 1;
        }
      }
    }

    this.logger.log(
      `Đã seed chain: ${globalSeq - 1} đơn / ${branches.length} CN / ${HISTORY_DAYS} ngày`,
    );
  }
}
