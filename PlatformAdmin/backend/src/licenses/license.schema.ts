import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LicenseDocument = HydratedDocument<License>;
export type LicenseStatus = "active" | "expired" | "suspended" | "pending";

@Schema({ timestamps: true })
export class License {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true, unique: true, trim: true })
  licenseKey: string;

  @Prop({ required: true, trim: true })
  plan: string;

  @Prop({ required: true, enum: ["active", "expired", "suspended", "pending"], default: "active" })
  status: LicenseStatus;

  @Prop({ required: true })
  issuedAt: string;

  @Prop({ required: true })
  expiresAt: string;

  @Prop({ default: 1 })
  maxStores: number;

  @Prop({ type: [String], default: [] })
  features: string[];
}

export const LicenseSchema = SchemaFactory.createForClass(License);
