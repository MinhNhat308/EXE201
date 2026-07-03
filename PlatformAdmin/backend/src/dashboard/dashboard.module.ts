import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BobaposModule } from "../bobapos/bobapos.module";
import { Contract, ContractSchema } from "../contracts/contract.schema";
import { Employee, EmployeeSchema } from "../employees/employee.schema";
import { Tenant, TenantSchema } from "../tenants/tenant.schema";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [
    BobaposModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Employee.name, schema: EmployeeSchema }
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
