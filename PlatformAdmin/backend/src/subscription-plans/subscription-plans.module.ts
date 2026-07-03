import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BobaposModule } from "../bobapos/bobapos.module";
import { Contract, ContractSchema } from "../contracts/contract.schema";
import { Tenant, TenantSchema } from "../tenants/tenant.schema";
import { SubscriptionPlan, SubscriptionPlanSchema } from "./subscription-plan.schema";
import { SubscriptionPlansController } from "./subscription-plans.controller";
import { SubscriptionPlansService } from "./subscription-plans.service";

@Module({
  imports: [
    BobaposModule,
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Contract.name, schema: ContractSchema }
    ])
  ],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService]
})
export class SubscriptionPlansModule {}
