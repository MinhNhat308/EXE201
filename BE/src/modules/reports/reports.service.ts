import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  normalizeOrderStatus,
  OrderStatus,
} from '../../common/enums/order-status.enum';
import { WorkShift } from '../../common/enums/work-shift.enum';
import type { TodayReportResponse } from '../orders/dto/today-report.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
  ShiftSession,
  ShiftSessionDocument,
} from '../shifts/schemas/shift-session.schema';
import type {
  StoreReportBundle,
  StoreReportCancellationRow,
  StoreReportEInvoiceConfig,
  StoreReportHourlyRow,
  StoreReportInventoryRow,
  StoreReportInvoiceSummary,
  StoreReportLowStockRow,
  StoreReportOrderRow,
  StoreReportProductRow,
  StoreReportSalesInvoiceRow,
  StoreReportShiftCloseRow,
  StoreReportShiftRow,
  StoreReportStaffRow,
  StoreReportSupplierReceiptRow,
} from './dto/store-report-bundle.dto';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import { InventoryService } from '../inventory/inventory.service';
import { TenantsService } from '../tenants/tenants.service';
import type { TenantDocument } from '../tenants/schemas/tenant.schema';

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:00–${pad((h + 1) % 24)}:00`;
});

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ShiftSession.name)
    private readonly shiftModel: Model<ShiftSessionDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    private readonly inventoryService: InventoryService,
    private readonly tenantsService: TenantsService,
  ) {}

  private getDateRange(dateStr?: string) {
    const base = dateStr
      ? new Date(`${dateStr}T00:00:00`)
      : new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const end = new Date(start.getTime() + 86400000);
    const date =
      dateStr ??
      `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    return { start, end, date };
  }

  private async findOrders(dateStr?: string, workShift?: WorkShift, branchId?: string) {
    const { start, end } = this.getDateRange(dateStr);
    const filter: Record<string, unknown> = {
      createdAt: { $gte: start, $lt: end },
    };
    if (workShift) filter.workShift = workShift;
    if (branchId) filter.branchId = new Types.ObjectId(branchId);
    return this.orderModel
      .find(filter)
      .sort({ dailySequence: 1, createdAt: -1 })
      .exec();
  }

  private buildSummary(orders: OrderDocument[]): TodayReportResponse {
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
      const isCompleted = status === OrderStatus.COMPLETED;

      if (byShift[shift]) byShift[shift].count += 1;
      if (byStatus[status]) {
        byStatus[status].count += 1;
        if (!isCancelled) byStatus[status].revenue += total;
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
      if (!byPaymentMethod[pm]) byPaymentMethod[pm] = { count: 0, total: 0 };
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
      .slice(0, 20)
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

  private buildHourly(orders: OrderDocument[]): StoreReportHourlyRow[] {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: HOUR_LABELS[hour],
      orderCount: 0,
      revenue: 0,
    }));

    for (const o of orders) {
      if (normalizeOrderStatus(o.status) === OrderStatus.CANCELLED) continue;
      const hour = (o.createdAt ?? new Date()).getHours();
      buckets[hour].orderCount += 1;
      buckets[hour].revenue += o.total ?? 0;
    }

    return buckets.filter((b) => b.orderCount > 0 || b.hour >= 6 && b.hour <= 23);
  }

  private buildOrderRows(orders: OrderDocument[]): StoreReportOrderRow[] {
    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      invoiceNumber: o.invoiceNumber,
      createdAt: (o.createdAt ?? new Date()).toISOString(),
      workShift: o.workShift,
      staffName: o.staffName,
      tableNumber: o.tableNumber,
      customerName: o.customerName,
      itemCount: (o.items ?? []).reduce((s, i) => s + i.quantity, 0),
      paymentMethod: o.paymentMethod,
      total: o.total ?? 0,
      status: normalizeOrderStatus(o.status),
    }));
  }

  private buildStaffRows(orders: OrderDocument[]): StoreReportStaffRow[] {
    const map = new Map<
      string,
      { orderCount: number; revenue: number; cancelledCount: number }
    >();

    for (const o of orders) {
      const name = o.staffName || 'Không rõ';
      const prev = map.get(name) ?? { orderCount: 0, revenue: 0, cancelledCount: 0 };
      const status = normalizeOrderStatus(o.status);
      if (status === OrderStatus.CANCELLED) {
        prev.cancelledCount += 1;
      } else {
        prev.orderCount += 1;
        prev.revenue += o.total ?? 0;
      }
      map.set(name, prev);
    }

    return [...map.entries()]
      .map(([staffName, v]) => ({
        staffName,
        orderCount: v.orderCount,
        revenue: v.revenue,
        cancelledCount: v.cancelledCount,
        averageTicket: v.orderCount > 0 ? Math.round(v.revenue / v.orderCount) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private buildProductRows(orders: OrderDocument[]): StoreReportProductRow[] {
    const map = new Map<string, { quantity: number; revenue: number }>();
    let totalRevenue = 0;

    for (const o of orders) {
      if (normalizeOrderStatus(o.status) === OrderStatus.CANCELLED) continue;
      for (const line of o.items ?? []) {
        const prev = map.get(line.name) ?? { quantity: 0, revenue: 0 };
        const lineRev = line.price * line.quantity;
        prev.quantity += line.quantity;
        prev.revenue += lineRev;
        totalRevenue += lineRev;
        map.set(line.name, prev);
      }
    }

    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        quantity: v.quantity,
        revenue: v.revenue,
        sharePercent:
          totalRevenue > 0 ? Math.round((v.revenue / totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private buildCancellations(orders: OrderDocument[]): StoreReportCancellationRow[] {
    return orders
      .filter((o) => normalizeOrderStatus(o.status) === OrderStatus.CANCELLED)
      .map((o) => ({
        orderNumber: o.orderNumber,
        invoiceNumber: o.invoiceNumber,
        cancelledAt: o.cancelledAt?.toISOString(),
        staffName: o.staffName,
        total: o.total ?? 0,
        cancelReason: o.cancelReason,
      }));
  }

  private buildByShiftRows(
    orders: OrderDocument[],
    summary: TodayReportResponse,
  ): StoreReportShiftRow[] {
    return Object.values(WorkShift).map((shift) => {
      const b = summary.byShift[shift];
      const cancelledCount = orders.filter(
        (o) =>
          o.workShift === shift &&
          normalizeOrderStatus(o.status) === OrderStatus.CANCELLED,
      ).length;
      return {
        workShift: shift,
        orderCount: b?.count ?? 0,
        paidCount: b?.paid ?? 0,
        revenue: b?.revenue ?? 0,
        completedCount: b?.completed ?? 0,
        servedRevenue: b?.servedRevenue ?? 0,
        cancelledCount,
      };
    });
  }

  private async buildShiftClose(
    dateStr: string,
    orders: OrderDocument[],
  ): Promise<StoreReportShiftCloseRow[]> {
    const { start, end } = this.getDateRange(dateStr);
    const sessions = await this.shiftModel
      .find({ startedAt: { $gte: start, $lt: end } })
      .exec();

    return Object.values(WorkShift).map((shift) => {
      const shiftOrders = orders.filter((o) => o.workShift === shift);
      const paid = shiftOrders.filter(
        (o) => normalizeOrderStatus(o.status) !== OrderStatus.CANCELLED,
      );
      const completed = paid.filter(
        (o) => normalizeOrderStatus(o.status) === OrderStatus.COMPLETED,
      );
      const open = paid.filter(
        (o) => normalizeOrderStatus(o.status) !== OrderStatus.COMPLETED,
      );
      const shiftSessions = sessions.filter((s) => s.workShift === shift);

      let cashTotal = 0;
      let bankTotal = 0;
      for (const o of paid) {
        if (o.paymentMethod === 'CASH') cashTotal += o.total ?? 0;
        if (o.paymentMethod === 'BANK_TRANSFER') bankTotal += o.total ?? 0;
      }

      return {
        workShift: shift,
        sessionsCount: shiftSessions.length,
        activeSessions: shiftSessions.filter((s) => !s.endedAt).length,
        orderCount: shiftOrders.length,
        paidRevenue: paid.reduce((s, o) => s + (o.total ?? 0), 0),
        cashTotal,
        bankTotal,
        openOrders: open.length,
        completedOrders: completed.length,
      };
    });
  }

  private async buildInventory(dateStr: string): Promise<{
    usage: StoreReportInventoryRow[];
    lowStock: StoreReportLowStockRow[];
    operations: StoreReportBundle['operations'];
  }> {
    try {
      const usageData = await this.inventoryService.getDailyUsage(dateStr);
      const overview = await this.inventoryService.getWarehouseOverview();
      const ops = await this.inventoryService.getOperationsDashboard();

      const usage: StoreReportInventoryRow[] = usageData.items.map((i) => ({
        ingredientName: i.name,
        unit: i.unit,
        totalUsed: i.totalUsed,
      }));

      const lowStock: StoreReportLowStockRow[] = [];
      for (const cat of Object.values(overview.byCategory ?? {})) {
        for (const item of cat ?? []) {
          if (item.isLow) {
            lowStock.push({
              name: item.name,
              warehouseName: item.warehouseName,
              currentStock: item.displayStock,
              minStock: item.displayMinStock,
              unit: item.displayUnit,
            });
          }
        }
      }

      return {
        usage,
        lowStock,
        operations: {
          pendingApproval: ops.pendingApproval,
          needsEndOfDayReturn: ops.needsEndOfDayReturn,
          pendingReturnsToday: ops.pendingReturnsToday,
          completedIssuesToday: ops.completedIssuesToday,
          completedReturnsToday: ops.completedReturnsToday,
          nccTodayCount: 0,
          nccTodayValue: 0,
        },
      };
    } catch {
      return {
        usage: [],
        lowStock: [],
        operations: {
          pendingApproval: 0,
          needsEndOfDayReturn: 0,
          pendingReturnsToday: 0,
          completedIssuesToday: 0,
          completedReturnsToday: 0,
          nccTodayCount: 0,
          nccTodayValue: 0,
        },
      };
    }
  }

  private buildEInvoiceConfig(tenant?: TenantDocument): StoreReportEInvoiceConfig {
    const s = tenant?.settings;
    return {
      storeName: tenant?.storeName ?? 'Cửa hàng',
      taxCode: s?.taxCode,
      invoiceTemplate: s?.invoiceTemplate,
      invoiceSerial: s?.invoiceSerial,
      vatRate: s?.vatRate ?? 8,
      address: s?.address,
      phone: s?.phone,
    };
  }

  private splitVat(total: number, vatRate: number) {
    const subtotalBeforeTax = Math.round(total / (1 + vatRate / 100));
    return {
      subtotalBeforeTax,
      vatAmount: total - subtotalBeforeTax,
    };
  }

  private buildSalesInvoices(
    orders: OrderDocument[],
    vatRate: number,
  ): StoreReportSalesInvoiceRow[] {
    return orders.map((o) => {
      const status = normalizeOrderStatus(o.status);
      const cancelled = status === OrderStatus.CANCELLED;
      const total = o.total ?? 0;
      const { subtotalBeforeTax, vatAmount } = this.splitVat(total, vatRate);
      return {
        invoiceNumber: o.invoiceNumber,
        orderNumber: o.orderNumber,
        issuedAt: (o.createdAt ?? new Date()).toISOString(),
        workShift: o.workShift,
        buyerName: o.customerName || 'Khách lẻ',
        itemCount: (o.items ?? []).reduce((s, i) => s + i.quantity, 0),
        subtotalBeforeTax,
        vatAmount,
        total,
        paymentMethod: o.paymentMethod,
        status,
        staffName: o.staffName,
        cancelled,
      };
    });
  }

  private buildInvoiceSummary(
    invoices: StoreReportSalesInvoiceRow[],
  ): StoreReportInvoiceSummary {
    const active = invoices.filter((i) => !i.cancelled);
    const cancelled = invoices.filter((i) => i.cancelled);
    return {
      issuedCount: active.length,
      cancelledCount: cancelled.length,
      subtotalBeforeTax: active.reduce((s, i) => s + i.subtotalBeforeTax, 0),
      vatAmount: active.reduce((s, i) => s + i.vatAmount, 0),
      totalAmount: active.reduce((s, i) => s + i.total, 0),
      cancelledAmount: cancelled.reduce((s, i) => s + i.total, 0),
      cashTotal: active
        .filter((i) => i.paymentMethod === 'CASH')
        .reduce((s, i) => s + i.total, 0),
      bankTotal: active
        .filter((i) => i.paymentMethod === 'BANK_TRANSFER')
        .reduce((s, i) => s + i.total, 0),
    };
  }

  async getStoreReportBundle(
    dateStr?: string,
    workShift?: WorkShift,
    tenantId?: string,
    branchId?: string,
  ): Promise<StoreReportBundle> {
    const { date } = this.getDateRange(dateStr);
    const orders = await this.findOrders(date, workShift, branchId);
    const summary = this.buildSummary(orders);

    let storeName: string | undefined;
    let branchName: string | undefined;
    let tenantDoc: TenantDocument | undefined;
    if (tenantId) {
      try {
        tenantDoc = await this.tenantsService.findById(tenantId);
        storeName = tenantDoc.storeName;
        if (branchId) {
          const branch = await this.branchModel
            .findOne({ _id: branchId, tenantId: new Types.ObjectId(tenantId) })
            .exec();
          branchName = branch?.name;
        }
      } catch {
        /* ignore */
      }
    }

    const eInvoiceConfig = this.buildEInvoiceConfig(tenantDoc);
    const salesInvoices = this.buildSalesInvoices(orders, eInvoiceConfig.vatRate);
    const invoiceSummary = this.buildInvoiceSummary(salesInvoices);

    const inventory = await this.buildInventory(date);

    const [
      stockSnapshot,
      stockMovements,
      supplierReceipts,
      stockVouchers,
    ] = await Promise.all([
      this.inventoryService.getStockSnapshotReport().catch(() => []),
      this.inventoryService.getMovementJournal(date).catch(() => []),
      this.inventoryService.getSupplierReceiptsForDate(date).catch(
        () => [] as StoreReportSupplierReceiptRow[],
      ),
      this.inventoryService.getStockVouchersForDate(date).catch(() => []),
    ]);

    return {
      meta: {
        date,
        workShift,
        generatedAt: new Date().toISOString(),
        storeName,
        branchId,
        branchName,
      },
      eInvoiceConfig,
      summary,
      salesInvoices,
      invoiceSummary,
      hourly: this.buildHourly(orders),
      orders: this.buildOrderRows(orders),
      staff: this.buildStaffRows(orders),
      products: this.buildProductRows(orders),
      cancellations: this.buildCancellations(orders),
      byShift: this.buildByShiftRows(orders, summary),
      shiftClose: await this.buildShiftClose(date, orders),
      inventoryUsage: inventory.usage,
      lowStock: inventory.lowStock,
      stockSnapshot,
      stockMovements,
      supplierReceipts,
      stockVouchers,
      operations: {
        ...inventory.operations,
        nccTodayCount: supplierReceipts.length,
        nccTodayValue: supplierReceipts
          .map((r) => r.totalValue)
          .reduce((a, b) => a + b, 0),
      },
    };
  }

  async getChainReportBundle(
    dateStr?: string,
    workShift?: WorkShift,
    tenantId?: string,
  ) {
    const { date } = this.getDateRange(dateStr);
    if (!tenantId) {
      return { meta: { date, generatedAt: new Date().toISOString() }, branches: [], totals: this.buildSummary([]) };
    }

    const branches = await this.branchModel
      .find({ tenantId: new Types.ObjectId(tenantId), isActive: true })
      .sort({ isDefault: -1, code: 1 })
      .exec();

    let tenantDoc: TenantDocument | undefined;
    try {
      tenantDoc = await this.tenantsService.findById(tenantId);
    } catch {
      /* ignore */
    }

    const branchRows = await Promise.all(
      branches.map(async (b) => {
        const orders = await this.findOrders(date, workShift, b._id.toString());
        const summary = this.buildSummary(orders);
        return {
          branchId: b._id.toString(),
          code: b.code,
          name: b.name,
          orderCount: summary.orderCount,
          revenue: summary.revenue,
          completedCount: summary.completedCount,
          paidCount: summary.paidCount,
          cancelledCount: summary.cancelledCount,
        };
      }),
    );

    const allOrders = await this.findOrders(date, workShift);
    const totals = this.buildSummary(allOrders);

    return {
      meta: {
        date,
        workShift,
        generatedAt: new Date().toISOString(),
        storeName: tenantDoc?.storeName,
        branchCount: branches.length,
      },
      branches: branchRows,
      totals,
    };
  }
}
