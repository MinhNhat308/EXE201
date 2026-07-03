import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;
export type SubscriptionPlanStatus = "active" | "inactive";

@Schema({ timestamps: true })
export class SubscriptionPlan {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  value: string;

  @Prop({ required: true, trim: true })
  price: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, enum: ["active", "inactive"], default: "active" })
  status: SubscriptionPlanStatus;

  @Prop({ type: [String], default: [] })
  features: string[];
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
