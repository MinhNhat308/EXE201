import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BobaposBridgeService } from "../bobapos/bobapos-bridge.service";
import { paginate, toDto } from "../common/mongo";
import type { QueryParams } from "../common/types";
import { Tenant, TenantDocument } from "../tenants/tenant.schema";
import { Contract, ContractDocument } from "./contract.schema";

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    private readonly bridge: BobaposBridgeService,
    private readonly config: ConfigService
  ) {}

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  findAll(params: QueryParams) {
    if (this.useBridge()) {
      return this.bridge.findAllInvoices(params);
    }
    return paginate(this.contractModel, params, ["code", "ownerName", "plan", "status"]);
  }

  async findOne(id: string) {
    if (this.useBridge()) {
      return this.bridge.findOneInvoice(id);
    }
    const conditions = id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }, { code: id }] : [{ code: id }];
    const contract = await this.contractModel.findOne({ $or: conditions }).exec();
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
    return toDto(contract);
  }

  async create(payload: any) {
    if (this.useBridge()) {
      throw new BadRequestException(
        "Chế độ BOBAPOS: hóa đơn tạo từ luồng thanh toán BOBAPOS (/dashboard/admin/billing)."
      );
    }
    const tenant = payload.tenantId ? await this.tenantModel.findById(payload.tenantId).exec() : null;
    const count = await this.contractModel.countDocuments().exec();
    const contract = await this.contractModel.create({
      code: `TF-${new Date().getFullYear()}-${String(count + 892).padStart(4, "0")}`,
      ownerName: tenant?.ownerName ?? "Nguyễn Văn An",
      status: "pending",
      ...payload
    });
    return toDto(contract);
  }

  async update(id: string, payload: any) {
    if (this.useBridge()) {
      throw new BadRequestException("Chế độ BOBAPOS: chỉ xem hóa đơn, không sửa tại admin portal.");
    }
    const tenant = payload.tenantId ? await this.tenantModel.findById(payload.tenantId).exec() : null;
    const updatePayload = {
      ...payload,
      ...(tenant ? { ownerName: tenant.ownerName } : {})
    };
    const contract = await this.contractModel.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true }).exec();
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
    return toDto(contract);
  }

  async remove(id: string) {
    if (this.useBridge()) {
      throw new BadRequestException("Chế độ BOBAPOS: không xóa hóa đơn từ admin portal.");
    }
    const contract = await this.contractModel.findByIdAndDelete(id).exec();
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
  }
}
