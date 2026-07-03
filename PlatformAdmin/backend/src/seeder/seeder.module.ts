import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Contract, ContractSchema } from "../contracts/contract.schema";
import { Employee, EmployeeSchema } from "../employees/employee.schema";
import { License, LicenseSchema } from "../licenses/license.schema";
import {
  SubscriptionPlan,
  SubscriptionPlanSchema
} from "../subscription-plans/subscription-plan.schema";
import { Tenant, TenantSchema } from "../tenants/tenant.schema";
import { User, UserSchema } from "../auth/user.schema";
import { SeederService } from "./seeder.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: License.name, schema: LicenseSchema },
      { name: User.name, schema: UserSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema }
    ])
  ],
  providers: [SeederService]
})
export class SeederModule {}
