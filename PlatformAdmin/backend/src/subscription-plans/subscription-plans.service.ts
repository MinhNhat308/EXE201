import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BobaposBridgeService } from "../bobapos/bobapos-bridge.service";
import { toDto } from "../common/mongo";
import { Contract, ContractDocument } from "../contracts/contract.schema";
import { Tenant, TenantDocument } from "../tenants/tenant.schema";
import { SubscriptionPlan, SubscriptionPlanDocument } from "./subscription-plan.schema";

import { BOBAPOS_PLAN_DEFINITIONS } from "../bobapos/bobapos.mapper";

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectModel(SubscriptionPlan.name) private readonly planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>,
    private readonly bridge: BobaposBridgeService,
    private readonly config: ConfigService
  ) {}

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  async findAll() {
    if (this.useBridge()) {
      return BOBAPOS_PLAN_DEFINITIONS.map((plan) => ({ id: plan.value, ...plan }));
    }
    await this.ensureDefaultPlans();
    const plans = await this.planModel.find().sort({ createdAt: 1 }).exec();
    return plans.map((plan) => toDto(plan));
  }

  async findOne(id: string) {
    if (this.useBridge()) {
      const plan = BOBAPOS_PLAN_DEFINITIONS.find((p) => p.value === id);
      if (!plan) throw new NotFoundException("Subscription plan not found");
      return { id: plan.value, ...plan };
    }
    await this.ensureDefaultPlans();
    const conditions = id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }, { value: id }] : [{ value: id }];
    const plan = await this.planModel.findOne({ $or: conditions }).exec();
    if (!plan) {
      throw new NotFoundException("Subscription plan not found");
    }
    return toDto(plan);
  }

  async create(payload: any) {
    const plan = await this.planModel.create(this.normalizePayload(payload));
    return toDto(plan);
  }

  async update(id: string, payload: any) {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException("Subscription plan not found");
    }

    const nextPayload = this.normalizePayload(payload, false);
    if (nextPayload.value && nextPayload.value !== plan.value) {
      const usedCount = await this.tenantModel.countDocuments({ plan: plan.value }).exec();
      if (usedCount > 0) {
        throw new BadRequestException("Cannot change value of a plan that is already used by owners");
      }
    }

    const updated = await this.planModel.findByIdAndUpdate(id, nextPayload, { new: true, runValidators: true }).exec();
    return toDto(updated);
  }

  async remove(id: string) {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException("Subscription plan not found");
    }

    const usedCount = await this.tenantModel.countDocuments({ plan: plan.value }).exec();
    if (usedCount > 0) {
      throw new BadRequestException("Cannot delete a plan that is already used by owners");
    }

    await this.planModel.findByIdAndDelete(id).exec();
  }

  async getOverview() {
    if (this.useBridge()) {
      return this.bridge.getSubscriptionPlansOverview();
    }
    await this.ensureDefaultPlans();
    const [tenants, contracts] = await Promise.all([
      this.tenantModel.find().lean().exec(),
      this.contractModel.find().lean().exec()
    ]);
    const planDefinitions = await this.planModel.find().sort({ createdAt: 1 }).lean().exec();

    const tenantPlanById = new Map(tenants.map((tenant) => [String(tenant._id), tenant.plan]));
    const plans = planDefinitions.map((definition) => {
      const planTenants = tenants.filter((tenant) => tenant.plan === definition.value);
      const tenantIds = new Set(planTenants.map((tenant) => String(tenant._id)));
      const planContracts = contracts.filter((contract) => tenantIds.has(contract.tenantId));
      const activeOwners = planTenants.filter((tenant) => tenant.status === "active").length;
      const contractAmount = planContracts.reduce((sum, contract) => sum + Number(contract.amount ?? 0), 0);

      return {
        id: String(definition._id),
        name: definition.name,
        value: definition.value,
        price: definition.price,
        description: definition.description,
        features: definition.features,
        owners: planTenants.length,
        activeOwners,
        stores: planTenants.length,
        activeContracts: planContracts.filter((contract) => contract.status === "active").length,
        contractAmount,
        status: definition.status
      };
    });
    const contractAmountByPlan = contracts.reduce<Record<string, number>>((result, contract) => {
      const plan = tenantPlanById.get(contract.tenantId);
      if (plan) {
        result[plan] = (result[plan] ?? 0) + Number(contract.amount ?? 0);
      }
      return result;
    }, {});

    return {
      metrics: [
        { label: "Active plans", value: plans.filter((plan) => plan.status === "active").length },
        { label: "Subscribed owners", value: tenants.length },
        { label: "Managed stores", value: tenants.length },
        { label: "Active contracts", value: contracts.filter((contract) => contract.status === "active").length }
      ],
      plans,
      contractAmountByPlan
    };
  }

  private async ensureDefaultPlans() {
    const count = await this.planModel.countDocuments().exec();
    if (count > 0) {
      return;
    }

    await this.planModel.insertMany(BOBAPOS_PLAN_DEFINITIONS.map((p) => ({ ...p })));
  }

  private normalizePayload(payload: any, requireAll = true) {
    const normalized: Record<string, unknown> = {};
    const stringFields = ["name", "value", "price", "description", "status"];

    stringFields.forEach((field) => {
      if (payload[field] !== undefined) {
        normalized[field] = String(payload[field]).trim();
      }
    });

    if (normalized.value) {
      normalized.value = String(normalized.value).toLowerCase().replace(/\s+/g, "_");
    }

    if (payload.features !== undefined) {
      normalized.features = Array.isArray(payload.features)
        ? payload.features.map((feature) => String(feature).trim()).filter(Boolean)
        : String(payload.features)
            .split("\n")
            .map((feature) => feature.trim())
            .filter(Boolean);
    }

    if (requireAll) {
      ["name", "value", "price", "description"].forEach((field) => {
        if (!normalized[field]) {
          throw new BadRequestException(`${field} is required`);
        }
      });
    }

    return normalized;
  }
}
