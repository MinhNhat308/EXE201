import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toDto } from "../common/mongo";
import { Contract, ContractDocument } from "../contracts/contract.schema";
import { Employee, EmployeeDocument } from "../employees/employee.schema";
import { License, LicenseDocument } from "../licenses/license.schema";
import { Tenant, TenantDocument } from "../tenants/tenant.schema";

export type SearchResultItem = {
  id: string;
  type: "owner" | "store" | "contract" | "employee" | "license";
  title: string;
  subtitle: string;
  href: string;
};

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(License.name) private readonly licenseModel: Model<LicenseDocument>
  ) {}

  async search(query: string, limit = 5) {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [] as SearchResultItem[] };
    }

    const regex = { $regex: trimmed, $options: "i" };
    const perTypeLimit = Math.max(1, Math.ceil(limit / 4));

    const [tenants, contracts, employees, licenses] = await Promise.all([
      this.tenantModel
        .find({ $or: [{ name: regex }, { ownerName: regex }, { ownerEmail: regex }] })
        .limit(perTypeLimit)
        .exec(),
      this.contractModel
        .find({ $or: [{ code: regex }, { ownerName: regex }, { plan: regex }] })
        .limit(perTypeLimit)
        .exec(),
      this.employeeModel
        .find({ $or: [{ fullName: regex }, { email: regex }, { department: regex }] })
        .limit(perTypeLimit)
        .exec(),
      this.licenseModel
        .find({ $or: [{ licenseKey: regex }, { plan: regex }, { productName: regex }] })
        .limit(perTypeLimit)
        .exec()
    ]);

    const results: SearchResultItem[] = [
      ...tenants.map((tenant) => {
        const dto = toDto(tenant)!;
        return {
          id: dto.id,
          type: "owner" as const,
          title: dto.ownerName,
          subtitle: `${dto.name} · ${dto.ownerEmail}`,
          href: `/owners/${dto.id}`
        };
      }),
      ...tenants.map((tenant) => {
        const dto = toDto(tenant)!;
        return {
          id: `${dto.id}-store`,
          type: "store" as const,
          title: dto.name,
          subtitle: `Owner: ${dto.ownerName}`,
          href: `/tenants/${dto.id}`
        };
      }),
      ...contracts.map((contract) => {
        const dto = toDto(contract)!;
        return {
          id: dto.id,
          type: "contract" as const,
          title: dto.code,
          subtitle: `${dto.ownerName} · ${dto.plan}`,
          href: `/contracts/${dto.id}`
        };
      }),
      ...employees.map((employee) => {
        const dto = toDto(employee)!;
        return {
          id: dto.id,
          type: "employee" as const,
          title: dto.fullName,
          subtitle: `${dto.email} · ${dto.role}`,
          href: `/employees/${dto.id}`
        };
      }),
      ...licenses.map((license) => {
        const dto = toDto(license)! as unknown as Record<string, unknown>;
        const plan = String(dto.plan ?? dto.productName ?? "");
        return {
          id: String(dto.id),
          type: "license" as const,
          title: String(dto.licenseKey),
          subtitle: `${plan} · ${dto.status}`,
          href: `/licenses/${dto.id}`
        };
      })
    ];

    return { results: results.slice(0, limit) };
  }
}
