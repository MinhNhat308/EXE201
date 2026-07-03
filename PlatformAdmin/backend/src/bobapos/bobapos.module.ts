import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BobaposBillingInvoice,
  BobaposBillingInvoiceSchema,
  BobaposSubscription,
  BobaposSubscriptionSchema,
  BobaposTenant,
  BobaposTenantSchema,
  BobaposUser,
  BobaposUserSchema,
} from './bobapos.schema';
import { BobaposBridgeService } from './bobapos-bridge.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BobaposTenant.name, schema: BobaposTenantSchema },
      { name: BobaposSubscription.name, schema: BobaposSubscriptionSchema },
      { name: BobaposUser.name, schema: BobaposUserSchema },
      { name: BobaposBillingInvoice.name, schema: BobaposBillingInvoiceSchema },
    ]),
  ],
  providers: [BobaposBridgeService],
  exports: [BobaposBridgeService],
})
export class BobaposModule {}
