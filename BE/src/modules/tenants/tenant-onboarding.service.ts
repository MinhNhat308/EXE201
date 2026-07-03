import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import {
  PaymentMethodConfig,
  PaymentMethodDocument,
} from '../payment-methods/schemas/payment-method.schema';
import {
  WarehouseLocation,
  WarehouseLocationDocument,
} from '../inventory/schemas/warehouse-location.schema';

const WAREHOUSES = [
  { code: 'KHO_TONG', name: 'Kho tổng', sortOrder: 0, isKitchenSource: false, isCentralWarehouse: true },
  { code: 'KHO1', name: 'Kho 1 — Quầy / Bếp', sortOrder: 1, isKitchenSource: true, isCentralWarehouse: false },
  { code: 'KHO2', name: 'Kho 2 — Kho khô', sortOrder: 2, isKitchenSource: false, isCentralWarehouse: false },
  { code: 'KHO3', name: 'Kho 3 — Kho lạnh', sortOrder: 3, isKitchenSource: false, isCentralWarehouse: false },
];

/** Tạo khung chi nhánh + kho + thanh toán. Menu/NVL/topping/công thức do enrichTenant. */
@Injectable()
export class TenantOnboardingService {
  private readonly logger = new Logger(TenantOnboardingService.name);

  constructor(
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(PaymentMethodConfig.name)
    private readonly paymentModel: Model<PaymentMethodDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async seedTenantData(tenantId: string): Promise<void> {
    const tid = new Types.ObjectId(tenantId);
    const exists = await this.warehouseModel.countDocuments({ tenantId: tid }).exec();
    if (exists > 0) {
      this.logger.log(`Tenant ${tenantId} đã có kho — bỏ qua shell seed`);
      return;
    }

    await this.branchModel.create({
      tenantId: tid,
      code: 'MAIN',
      name: 'Chi nhánh chính',
      isDefault: true,
      isActive: true,
    });

    for (const w of WAREHOUSES) {
      await this.warehouseModel.create({ ...w, tenantId: tid, isActive: true });
    }

    await this.paymentModel.insertMany([
      { tenantId: tid, code: 'CASH', label: 'Tiền mặt', isActive: true, sortOrder: 0 },
      { tenantId: tid, code: 'BANK_TRANSFER', label: 'Chuyển khoản / QR', isActive: true, sortOrder: 1 },
    ]);

    this.logger.log(`Đã tạo shell kho/chi nhánh cho tenant ${tenantId}`);
  }
}
