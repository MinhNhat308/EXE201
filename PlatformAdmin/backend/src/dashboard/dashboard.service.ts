import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BobaposBridgeService } from "../bobapos/bobapos-bridge.service";
import { Contract, ContractDocument } from "../contracts/contract.schema";
import { Employee, EmployeeDocument } from "../employees/employee.schema";
import { Tenant, TenantDocument } from "../tenants/tenant.schema";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    private readonly bridge: BobaposBridgeService,
    private readonly config: ConfigService
  ) {}

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  async getOverview() {
    if (this.useBridge()) {
      return this.bridge.getDashboardOverview();
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      owners,
      activeOwners,
      employees,
      activeEmployees,
      contractsExpiringSoon,
      planOverview,
      registrationTrends,
      recentTenants,
      recentContracts,
      revenue
    ] = await Promise.all([
      this.tenantModel.countDocuments().exec(),
      this.tenantModel.countDocuments({ status: "active" }).exec(),
      this.employeeModel.countDocuments().exec(),
      this.employeeModel.countDocuments({ status: "active" }).exec(),
      this.contractModel
        .countDocuments({
          endDate: {
            $gte: this.toDateInput(now),
            $lte: this.toDateInput(thirtyDaysFromNow)
          }
        })
        .exec(),
      this.getPlanOverview(),
      this.getRegistrationTrends(now),
      this.tenantModel.find().sort({ createdAt: -1 }).limit(4).exec(),
      this.contractModel.find().sort({ createdAt: -1 }).limit(4).exec(),
      this.getRevenueOverview(now)
    ]);

    return {
      metrics: [
        { key: "owners", label: "Active Owners", value: activeOwners, detail: `${owners} total owners` },
        { key: "stores", label: "Stores", value: owners, detail: `${activeOwners} active stores` },
        { key: "employees", label: "Active Employees", value: activeEmployees, detail: `${employees} total employees` },
        { key: "contractsExpiringSoon", label: "Contracts Expiring Soon", value: contractsExpiringSoon, detail: "Next 30 days" }
      ],
      registrationTrends,
      planOverview,
      recentActivities: this.buildRecentActivities(recentTenants, recentContracts),
      revenue,
      health: {
        api: "Operational",
        database: "Healthy",
        server: "Stable"
      }
    };
  }

  private async getPlanOverview() {
    const rows = await this.tenantModel.aggregate<{ _id: string; value: number }>([
      { $group: { _id: "$plan", value: { $sum: 1 } } },
      { $sort: { value: -1 } }
    ]);

    return rows.map((row) => ({
      label: this.toTitle(row._id),
      value: row.value
    }));
  }

  private async getRegistrationTrends(now: Date) {
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleString("en-US", { month: "short" })
      };
    });
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const rows = await this.tenantModel.aggregate<{ _id: string; owners: number; stores: number }>([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          owners: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          stores: { $sum: 1 }
        }
      }
    ]);
    const byMonth = new Map(rows.map((row) => [row._id, row]));

    return months.map((month) => ({
      month: month.label,
      owners: byMonth.get(month.key)?.owners ?? 0,
      stores: byMonth.get(month.key)?.stores ?? 0
    }));
  }

  private async getRevenueOverview(now: Date) {
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleString("en-US", { month: "short" })
      };
    });
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startInput = this.toDateInput(startDate);
    const rows = await this.contractModel.aggregate<{ _id: string; amount: number }>([
      { $match: { startDate: { $gte: startInput } } },
      { $group: { _id: { $substr: ["$startDate", 0, 7] }, amount: { $sum: "$amount" } } }
    ]);
    const byMonth = new Map(rows.map((row) => [row._id, row.amount]));
    const points = months.map((month) => ({ month: month.label, amount: byMonth.get(month.key) ?? 0 }));
    const monthlyRevenue = points[points.length - 1]?.amount ?? 0;
    const previousRevenue = points[points.length - 2]?.amount ?? 0;
    const growthRate = previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const activeSubscriptions = await this.contractModel.countDocuments({ status: "active" }).exec();

    return {
      monthlyRevenue,
      activeSubscriptions,
      growthRate,
      points
    };
  }

  private buildRecentActivities(tenants: TenantDocument[], contracts: ContractDocument[]) {
    return [
      ...tenants.map((tenant) => ({
        id: `tenant-${tenant._id}`,
        activity: "Owner created",
        user: "Admin",
        target: tenant.ownerName,
        status: this.toTitle(tenant.status),
        createdAt: this.getCreatedAt(tenant)
      })),
      ...contracts.map((contract) => ({
        id: `contract-${contract._id}`,
        activity: "Contract created",
        user: "Admin",
        target: contract.code,
        status: this.toTitle(contract.status),
        createdAt: this.getCreatedAt(contract)
      }))
    ]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 6);
  }

  private toDateInput(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private toTitle(value: unknown) {
    const normalized = typeof value === "string" && value.trim() ? value : "unknown";
    return normalized
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private getCreatedAt(document: unknown) {
    const createdAt = (document as { createdAt?: Date }).createdAt;
    return (createdAt ?? new Date()).toISOString();
  }
}
