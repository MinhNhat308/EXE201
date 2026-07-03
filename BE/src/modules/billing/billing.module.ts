import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BillingInvoice, BillingInvoiceSchema } from './schemas/billing-invoice.schema';
import { BillingController, MomoWebhookController } from './billing.controller';
import { BillingService } from './billing.service';
import { MomoPaymentService } from './momo-payment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BillingInvoice.name, schema: BillingInvoiceSchema },
    ]),
    SubscriptionsModule,
  ],
  controllers: [BillingController, MomoWebhookController],
  providers: [BillingService, MomoPaymentService],
  exports: [BillingService],
})
export class BillingModule {}
