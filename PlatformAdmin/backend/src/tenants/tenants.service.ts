import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BobaposBridgeService } from "../bobapos/bobapos-bridge.service";
import { paginate, toDto } from "../common/mongo";
import type { QueryParams } from "../common/types";
import { hashPassword } from "../auth/password.util";
import { User, UserDocument } from "../auth/user.schema";
import { Tenant, TenantDocument } from "./tenant.schema";

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly bridge: BobaposBridgeService,
    private readonly config: ConfigService
  ) {}

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  findAll(params: QueryParams) {
    if (this.useBridge()) {
      return this.bridge.findAllTenants(params);
    }
    return paginate(this.tenantModel, params, [
      "name",
      "ownerName",
      "ownerEmail",
      "plan",
      "status",
      "location",
      "address"
    ]);
  }

  async findOne(id: string) {
    if (this.useBridge()) {
      return this.bridge.findOneTenant(id);
    }
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
    return toDto(tenant);
  }

  async create(payload: Record<string, unknown>) {
    if (this.useBridge()) {
      throw new BadRequestException(
        "Chế độ BOBAPOS: cửa hàng mới đăng ký qua trang BOBAPOS (/register), admin portal chỉ xem & chỉnh sửa."
      );
    }
    const { initialPassword, ...tenantData } = payload;
    const tenant = await this.tenantModel.create({
      status: "pending",
      ...tenantData,
      slug: await this.createUniqueSlug(String(tenantData.name ?? "tenant"))
    });

    if (tenant.ownerEmail && typeof initialPassword === "string" && initialPassword.length >= 8) {
      const email = tenant.ownerEmail.toLowerCase();
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        throw new BadRequestException("Owner email is already registered as a user");
      }

      await this.userModel.create({
        fullName: tenant.ownerName,
        email,
        role: tenant.accountRole ?? "super_admin",
        tenantId: tenant._id.toString(),
        passwordHash: hashPassword(initialPassword),
        isActive: true
      });
    }

    return toDto(tenant);
  }

  async update(id: string, payload: Record<string, unknown>) {
    if (this.useBridge()) {
      return this.bridge.updateTenant(id, payload);
    }
    const { initialPassword: _ignored, ...tenantData } = payload;
    if (tenantData.name && !tenantData.slug) {
      const currentTenant = await this.tenantModel.findById(id).exec();
      if (currentTenant && currentTenant.name !== tenantData.name) {
        tenantData.slug = await this.createUniqueSlug(String(tenantData.name), id);
      }
    }
    const tenant = await this.tenantModel
      .findByIdAndUpdate(id, tenantData, { new: true, runValidators: true })
      .exec();
    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
    return toDto(tenant);
  }

  async remove(id: string) {
    if (this.useBridge()) {
      return this.bridge.removeTenant(id);
    }
    await this.tenantModel.findByIdAndDelete(id).exec();
  }

  private async createUniqueSlug(name: string, excludedId?: string) {
    const baseSlug =
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "tenant";
    let slug = baseSlug;
    let suffix = 2;

    while (
      await this.tenantModel
        .exists({
          slug,
          ...(excludedId ? { _id: { $ne: excludedId } } : {})
        })
        .exec()
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}
