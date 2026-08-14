import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { paginate, toDto } from "../common/mongo";
import type { QueryParams } from "../common/types";
import { License, LicenseDocument } from "./license.schema";

function normalizeLicense(raw: Record<string, unknown> | null) {
  if (!raw) {
    return raw;
  }

  return {
    ...raw,
    plan: raw.plan ?? raw.productName ?? "",
    issuedAt: raw.issuedAt ?? raw.activatedAt ?? "",
    features: Array.isArray(raw.features) ? raw.features : []
  };
}

@Injectable()
export class LicensesService {
  constructor(
    @InjectModel(License.name) private readonly licenseModel: Model<LicenseDocument>,
    private readonly config: ConfigService
  ) { }

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  async findAll(params: QueryParams) {
    if (this.useBridge()) {
      const page = Number(params.page ?? 1);
      const limit = Number(params.limit ?? 10);
      return { data: [], meta: { page, limit, total: 0, totalPages: 1 } };
    }
    const result = await paginate(this.licenseModel, params, ["licenseKey", "plan", "status", "productName"]);
    return {
      ...result,
      data: result.data.map((row) => normalizeLicense(row as Record<string, unknown>))
    };
  }

  async findOne(id: string) {
    if (this.useBridge()) throw new NotFoundException("BOBAPOS uses subscriptions instead of licenses");
    const license = await this.licenseModel.findById(id).exec();
    if (!license) {
      throw new NotFoundException("License not found");
    }
    return normalizeLicense(toDto(license) as unknown as Record<string, unknown>);
  }

  async create(payload: Record<string, unknown>) {
    if (this.useBridge()) throw new BadRequestException("BOBAPOS uses subscriptions instead of licenses");
    const license = await this.licenseModel.create(payload);
    return normalizeLicense(toDto(license) as unknown as Record<string, unknown>);
  }

  async update(id: string, payload: Record<string, unknown>) {
    if (this.useBridge()) throw new BadRequestException("BOBAPOS uses subscriptions instead of licenses");
    const license = await this.licenseModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .exec();
    if (!license) {
      throw new NotFoundException("License not found");
    }
    return normalizeLicense(toDto(license) as unknown as Record<string, unknown>);
  }

  async remove(id: string) {
    if (this.useBridge()) throw new BadRequestException("BOBAPOS uses subscriptions instead of licenses");
    const license = await this.licenseModel.findByIdAndDelete(id).exec();
    if (!license) {
      throw new NotFoundException("License not found");
    }
  }
}
