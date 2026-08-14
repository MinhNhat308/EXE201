import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingInvoice, BillingInvoiceSchema } from '../billing/schemas/billing-invoice.schema';
import { InventoryModule } from '../inventory/inventory.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/payment-transaction.schema';
import { PaymentsController, SepayWebhookController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SepayService } from './sepay.service';
import { VietQrService } from './vietqr.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: BillingInvoice.name, schema: BillingInvoiceSchema },
    ]),
    SubscriptionsModule,
    TenantsModule,
    forwardRef(() => InventoryModule),
  ],
  controllers: [PaymentsController, SepayWebhookController],
  providers: [PaymentsService, VietQrService, SepayService],
  exports: [PaymentsService, VietQrService],
})
export class PaymentsModule {}
