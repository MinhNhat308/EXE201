import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BobaposModule } from "../bobapos/bobapos.module";
import { Tenant, TenantSchema } from "../tenants/tenant.schema";
import { Contract, ContractSchema } from "./contract.schema";
import { ContractsController } from "./contracts.controller";
import { ContractsPdfService } from "./contracts-pdf.service";
import { ContractsService } from "./contracts.service";

@Module({
  imports: [
    BobaposModule,
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Tenant.name, schema: TenantSchema }
    ])
  ],
  controllers: [ContractsController],
  providers: [ContractsService, ContractsPdfService],
  exports: [ContractsService, MongooseModule]
})
export class ContractsModule {}
