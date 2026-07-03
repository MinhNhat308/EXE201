import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BobaposModule } from "../bobapos/bobapos.module";
import { User, UserSchema } from "../auth/user.schema";
import { Tenant, TenantSchema } from "./tenant.schema";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [
    BobaposModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService, MongooseModule]
})
export class TenantsModule {}
