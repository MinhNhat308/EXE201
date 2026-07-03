import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReturnClosureStatus } from '../common/enums/return-closure-status.enum';
import { Role } from '../common/enums/role.enum';
import { StockRequestStatus } from '../common/enums/stock-request-status.enum';
import { StockRequestType } from '../common/enums/stock-request-type.enum';
import { Branch, BranchDocument } from '../modules/branches/schemas/branch.schema';
import { Ingredient, IngredientDocument } from '../modules/inventory/schemas/ingredient.schema';
import { StockLot, StockLotDocument } from '../modules/inventory/schemas/stock-lot.schema';
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
import { User, UserDocument } from '../modules/users/schemas/user.schema';

const SEED_MARKER = 'CHAIN-OPS-v1';
const RECEIPT_PREFIX = 'CHAIN-NCC-';

@Injectable()
export class DemoChainOperationsSeedService {
  private readonly logger = new Logger(DemoChainOperationsSeedService.name);

  constructor(
    @InjectModel(SupplierReceipt.name)
    private readonly receiptModel: Model<SupplierReceiptDocument>,
    @InjectModel(StockTransferRequest.name)
    private readonly stockRequestModel: Model<StockTransferRequestDocument>,
    @InjectModel(StockLot.name) private readonly lotModel: Model<StockLotDocument>,
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async seedChainOperations(tenantId: string): Promise<void> {
    const tid = new Types.ObjectId(tenantId);
    const exists = await this.receiptModel
      .countDocuments({
        tenantId: tid,
        documentNumber: { $regex: `^${RECEIPT_PREFIX}` },
      })
      .exec();
    if (exists >= 4) {
      this.logger.log('Chain operations demo đã có — bỏ qua');
      return;
    }

    const staleReceipts = await this.receiptModel
      .find({ tenantId: tid, documentNumber: { $regex: `^${RECEIPT_PREFIX}` } })
      .select('_id')
      .exec();
    if (staleReceipts.length) {
      await this.lotModel
        .deleteMany({
          tenantId: tid,
          supplierReceiptId: { $in: staleReceipts.map((r) => r._id) },
        })
        .exec();
    }
    await this.receiptModel
      .deleteMany({ tenantId: tid, documentNumber: { $regex: `^${RECEIPT_PREFIX}` } })
      .exec();
    await this.stockRequestModel
      .deleteMany({ tenantId: tid, requestNumber: { $regex: '^CHAIN-CP-' } })
      .exec();

    const [branches, ingredients, accounting] = await Promise.all([
      this.branchModel.find({ tenantId: tid, isActive: true }).sort({ code: 1 }).exec(),
      this.ingredientModel.find({ tenantId: tid }).exec(),
      this.userModel.findOne({ tenantId: tid, role: Role.ACCOUNTING, isActive: true }).exec(),
    ]);

    if (branches.length < 2 || ingredients.length < 3) {
      this.logger.warn('Bỏ qua chain ops — thiếu chi nhánh hoặc NL');
      return;
    }

    const ingByName = new Map(ingredients.map((i) => [i.name, i]));
    const milk = ingByName.get('Sữa tươi');
    const tea = ingByName.get('Nước trà đen (pha sẵn)');
    const pearl = ingByName.get('Trân châu đen');
    if (!milk || !tea) return;

    const today = new Date();
    const businessDate = today.toISOString().slice(0, 10);
    let receiptSeq = 1;

    for (const branch of branches) {
      const whs = await this.warehouseModel
        .find({ tenantId: tid, branchId: branch._id, isActive: true })
        .exec();
      const khoTong = whs.find((w) => w.isCentralWarehouse) ?? whs[0];
      const kho1 = whs.find((w) => w.isKitchenSource) ?? whs[1];
      if (!khoTong || !kho1) continue;

      const docDate = new Date(today);
      docDate.setDate(docDate.getDate() - (receiptSeq % 3));
      const expiry = new Date(docDate);
      expiry.setDate(expiry.getDate() + 14);

      const receipt = await this.receiptModel.create({
        tenantId: tid,
        supplierName: `NCC Miền Nam · ${branch.code}`,
        documentNumber: `${RECEIPT_PREFIX}${branch.code}-${String(receiptSeq).padStart(3, '0')}`,
        warehouseId: khoTong._id,
        warehouseCode: khoTong.code,
        warehouseName: khoTong.name,
        documentDate: docDate,
        note: `${SEED_MARKER} · Nhập kho tổng ${branch.name}`,
        lines: [
          {
            ingredientId: milk._id,
            quantity: 20_000 + receiptSeq * 500,
            unitPrice: 28,
            expiryDate: expiry,
          },
          {
            ingredientId: tea._id,
            quantity: 15_000,
            unitPrice: 12,
            expiryDate: expiry,
          },
          ...(pearl
            ? [{ ingredientId: pearl._id, quantity: 3_000, unitPrice: 45, expiryDate: expiry }]
            : []),
        ],
        createdBy: accounting?._id,
        createdByName: accounting?.fullName ?? 'Kế toán chuỗi',
        createdAt: docDate,
        updatedAt: docDate,
      });

      const morning = new Date(today);
      morning.setHours(7, 15, 0, 0);

      await this.stockRequestModel.create({
        tenantId: tid,
        requestNumber: `CHAIN-CP-${branch.code}`,
        type: StockRequestType.DISPATCH_FROM_CENTRAL,
        status: StockRequestStatus.COMPLETED,
        fromWarehouseId: khoTong._id,
        fromWarehouseCode: khoTong.code,
        fromWarehouseName: khoTong.name,
        toWarehouseId: kho1._id,
        toWarehouseCode: kho1.code,
        toWarehouseName: kho1.name,
        permitDocumentNumber: `CT-${branch.code}-001`,
        permitDocumentDate: businessDate,
        purpose: `Cấp phát ca sáng · ${branch.code}`,
        note: SEED_MARKER,
        businessDate,
        lines: [
          { ingredientId: milk._id, quantity: 18_000 },
          { ingredientId: tea._id, quantity: 12_000 },
        ],
        requestedBy: accounting?._id,
        requestedByName: accounting?.fullName ?? 'Kế toán',
        submittedAt: morning,
        reviewedBy: accounting?._id,
        reviewedByName: accounting?.fullName ?? 'Kế toán',
        reviewedAt: new Date(morning.getTime() + 20 * 60_000),
        completedAt: new Date(morning.getTime() + 25 * 60_000),
        returnClosureStatus: ReturnClosureStatus.NOT_APPLICABLE,
        createdAt: morning,
        updatedAt: morning,
      });

      await this.lotModel.create({
        tenantId: tid,
        warehouseId: khoTong._id,
        ingredientId: milk._id,
        quantity: 8_000,
        expiryDate: expiry,
        supplierReceiptId: receipt._id,
        receivedAt: docDate,
      });

      receiptSeq += 1;
    }

    this.logger.log(
      `Đã seed chain ops: NCC + phiếu cấp phát + lot HSD cho ${branches.length} CN`,
    );
  }
}
