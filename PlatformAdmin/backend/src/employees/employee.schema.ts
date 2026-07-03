import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EmployeeDocument = HydratedDocument<Employee>;
export type EmployeeStatus = "active" | "inactive" | "pending";

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true, enum: ["active", "inactive", "pending"], default: "pending" })
  status: EmployeeStatus;

  @Prop()
  lastLoginAt?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
