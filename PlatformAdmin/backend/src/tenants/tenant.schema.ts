import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TenantDocument = HydratedDocument<Tenant>;
export type TenantStatus = "active" | "inactive" | "pending" | "suspended";

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  slug: string;

  @Prop({ required: true, trim: true })
  ownerName: string;

  @Prop({ required: true, trim: true, lowercase: true })
  ownerEmail: string;

  @Prop({ required: true, trim: true })
  plan: string;

  @Prop({ required: true, enum: ["active", "inactive", "pending", "suspended"], default: "pending" })
  status: TenantStatus;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  taxId?: string;

  @Prop({ trim: true })
  businessLicense?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  ownerPhone?: string;

  @Prop({ default: "super_admin" })
  accountRole?: string;

  @Prop({ default: "v2.4.1" })
  softwareVersion?: string;

  @Prop({ default: 12 })
  contractDurationMonths?: number;

  @Prop({ default: 250 })
  setupFee?: number;

  @Prop({ default: 0 })
  monthlyFee?: number;

  @Prop({ default: 0 })
  discount?: number;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
