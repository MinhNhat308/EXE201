import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ContractDocument = HydratedDocument<Contract>;
export type ContractStatus = "active" | "pending" | "expired" | "completed";

@Schema({ timestamps: true })
export class Contract {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop({ required: true })
  plan: string;

  @Prop({ required: true, enum: ["active", "pending", "expired", "completed"], default: "pending" })
  status: ContractStatus;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  durationMonths?: number;

  @Prop()
  additionalTerms?: string;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
