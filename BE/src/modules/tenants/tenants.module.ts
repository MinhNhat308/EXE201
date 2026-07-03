import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import {
  PaymentMethodConfig,
  PaymentMethodSchema,
} from '../payment-methods/schemas/payment-method.schema';
import {
  WarehouseLocation,
  WarehouseLocationSchema,
} from '../inventory/schemas/warehouse-location.schema';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantOnboardingService } from './tenant-onboarding.service';
import { TenantsService } from './tenants.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: WarehouseLocation.name, schema: WarehouseLocationSchema },
      { name: PaymentMethodConfig.name, schema: PaymentMethodSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  providers: [TenantsService, TenantOnboardingService],
  exports: [TenantsService, TenantOnboardingService, MongooseModule],
})
export class TenantsModule {}
