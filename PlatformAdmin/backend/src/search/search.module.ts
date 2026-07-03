import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Contract, ContractSchema } from "../contracts/contract.schema";
import { Employee, EmployeeSchema } from "../employees/employee.schema";
import { License, LicenseSchema } from "../licenses/license.schema";
import { Tenant, TenantSchema } from "../tenants/tenant.schema";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: License.name, schema: LicenseSchema }
    ])
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
