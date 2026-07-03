import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch, BranchDocument } from '../modules/branches/schemas/branch.schema';
import { Ingredient, IngredientDocument } from '../modules/inventory/schemas/ingredient.schema';
import {
  WarehouseLocation,
  WarehouseLocationDocument,
} from '../modules/inventory/schemas/warehouse-location.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../modules/inventory/schemas/warehouse-stock.schema';
import { CHAIN_DEMO_PACK } from './demo-chain-inventory.data';

const WAREHOUSE_DEFS = [
  { suffix: 'KHO_TONG', name: 'Kho tổng', sortOrder: 0, isCentral: true, isKitchen: false },
  { suffix: 'KHO1', name: 'Kho 1 — Bếp', sortOrder: 1, isCentral: false, isKitchen: true },
  { suffix: 'KHO2', name: 'Kho 2 — Khô', sortOrder: 2, isCentral: false, isKitchen: false },
  { suffix: 'KHO3', name: 'Kho 3 — Lạnh', sortOrder: 3, isCentral: false, isKitchen: false },
];

const BRANCH_ADDRESSES: Record<string, string> = {
  MAIN: '45 Lê Lợi, Q.1, TP.HCM — Trụ sở',
  'CN-Q1': '88 Nguyễn Huệ, Q.1, TP.HCM',
  'CN-Q7': '12 Nguyễn Thị Thập, Q.7, TP.HCM',
  'CN-TD': '56 Võ Văn Ngân, Thủ Đức',
};

@Injectable()
export class DemoChainBranchSetupService {
  private readonly logger = new Logger(DemoChainBranchSetupService.name);

  constructor(
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    @InjectModel(WarehouseLocation.name)
    private readonly warehouseModel: Model<WarehouseLocationDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(Ingredient.name)
    private readonly ingredientModel: Model<IngredientDocument>,
  ) {}

  async setupChainBranches(tenantId: string): Promise<void> {
    const tid = new Types.ObjectId(tenantId);
    const marker = await this.warehouseModel
      .findOne({ tenantId: tid, code: 'CN-Q1_KHO1' })
      .exec();
    if (marker) {
      this.logger.log('Chain branch warehouses đã có — bỏ qua setup');
      return;
    }

    const branches = await this.branchModel.find({ tenantId: tid, isActive: true }).exec();
    if (branches.length < 2) {
      this.logger.warn('Chain setup — chưa đủ chi nhánh');
      return;
    }

    for (const b of branches) {
      if (BRANCH_ADDRESSES[b.code]) {
        b.address = BRANCH_ADDRESSES[b.code];
        await b.save();
      }
    }

    const ingredients = await this.ingredientModel.find({ tenantId: tid }).exec();
    const ingByName = new Map(ingredients.map((i) => [i.name, i._id]));

    const legacy = await this.warehouseModel
      .find({ tenantId: tid, code: { $in: ['KHO_TONG', 'KHO1', 'KHO2', 'KHO3'] } })
      .exec();
    const mainBranch = branches.find((b) => b.isDefault) ?? branches[0];
    for (const wh of legacy) {
      wh.branchId = mainBranch._id;
      if (!wh.code.includes('_')) {
        wh.code = `${mainBranch.code}_${wh.code}`;
        wh.name = `${mainBranch.name} · ${wh.name}`;
      }
      await wh.save();
    }

    const subBranches = branches.filter((b) => !b._id.equals(mainBranch._id));
    for (const branch of subBranches) {
      for (const def of WAREHOUSE_DEFS) {
        const code = `${branch.code}_${def.suffix}`;
        const exists = await this.warehouseModel.findOne({ tenantId: tid, code }).exec();
        if (exists) continue;

        const wh = await this.warehouseModel.create({
          tenantId: tid,
          branchId: branch._id,
          code,
          name: `${branch.name} · ${def.name}`,
          sortOrder: def.sortOrder,
          isActive: true,
          isKitchenSource: def.isKitchen,
          isCentralWarehouse: def.isCentral,
        });

        const stockKey = def.suffix as keyof typeof CHAIN_DEMO_PACK.stockByWarehouse;
        const lines = CHAIN_DEMO_PACK.stockByWarehouse[stockKey] ?? [];
        const scale = branch.code === 'CN-Q7' ? 0.85 : branch.code === 'CN-TD' ? 0.75 : 1;

        for (const line of lines) {
          const ingId = ingByName.get(line.ingredient);
          if (!ingId) continue;
          await this.stockModel.create({
            tenantId: tid,
            warehouseId: wh._id,
            ingredientId: ingId,
            currentStock: Math.round(line.currentStock * scale),
            minStock: Math.round(line.minStock * scale),
          });
        }
      }
    }

    this.logger.log(
      `Đã setup kho theo ${branches.length} chi nhánh (MAIN + ${subBranches.length} CN)`,
    );
  }
}
