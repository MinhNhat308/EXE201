import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** Đọc collection `tenants` của BOBAPOS (POS) — không ghi đè schema POS */
@Schema({ collection: 'tenants', strict: false })
export class BobaposTenant {
  @Prop()
  storeName?: string;

  @Prop()
  slug?: string;

  @Prop()
  packageType?: string;

  @Prop()
  intendedPlan?: string;

  @Prop()
  status?: string;

  @Prop()
  trialExpiredAt?: Date;

  @Prop()
  subscriptionExpiredAt?: Date;

  @Prop({ type: Types.ObjectId })
  ownerUserId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  settings?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type BobaposTenantDocument = HydratedDocument<BobaposTenant>;
export const BobaposTenantSchema = SchemaFactory.createForClass(BobaposTenant);

@Schema({ collection: 'subscriptions', strict: false })
export class BobaposSubscription {
  @Prop({ type: Types.ObjectId })
  tenantId?: Types.ObjectId;

  @Prop()
  plan?: string;

  @Prop()
  status?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  maxEmployees?: number;

  @Prop()
  maxBranches?: number;

  @Prop()
  trialUsed?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export type BobaposSubscriptionDocument = HydratedDocument<BobaposSubscription>;
export const BobaposSubscriptionSchema = SchemaFactory.createForClass(BobaposSubscription);

/** User cửa hàng BOBAPOS — collection `users` (khác `platform_users`) */
@Schema({ collection: 'users', strict: false })
export class BobaposUser {
  @Prop({ type: Types.ObjectId })
  tenantId?: Types.ObjectId;

  @Prop()
  fullName?: string;

  @Prop()
  email?: string;

  @Prop()
  username?: string;

  @Prop()
  role?: string;

  @Prop()
  phone?: string;

  @Prop()
  isActive?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export type BobaposUserDocument = HydratedDocument<BobaposUser>;
export const BobaposUserSchema = SchemaFactory.createForClass(BobaposUser);

@Schema({ collection: 'billing_invoices', strict: false })
export class BobaposBillingInvoice {
  @Prop({ type: Types.ObjectId })
  tenantId?: Types.ObjectId;

  @Prop()
  plan?: string;

  @Prop()
  amount?: number;

  @Prop()
  currency?: string;

  @Prop()
  status?: string;

  @Prop()
  paymentMethod?: string;

  @Prop()
  periodStart?: Date;

  @Prop()
  periodEnd?: Date;

  @Prop()
  note?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type BobaposBillingInvoiceDocument = HydratedDocument<BobaposBillingInvoice>;
export const BobaposBillingInvoiceSchema = SchemaFactory.createForClass(BobaposBillingInvoice);
