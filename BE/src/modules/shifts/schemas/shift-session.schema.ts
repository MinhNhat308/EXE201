import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';
import { WorkRole } from '../../../common/enums/work-role.enum';
import { WorkShift } from '../../../common/enums/work-shift.enum';
import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';

export type ShiftSessionDocument = ShiftSession & Document;

@Schema({ timestamps: true, collection: 'shift_sessions' })
export class ShiftSession {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  userName: string;

  @Prop({ required: true, enum: Role })
  role: Role;

  @Prop({ enum: WorkRole })
  workRole?: WorkRole;

  @Prop({ required: true, enum: WorkShift, index: true })
  workShift: WorkShift;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  endedAt?: Date;

  /** Chuẩn bị cho Chain — chi nhánh */
  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;
}

export const ShiftSessionSchema = SchemaFactory.createForClass(ShiftSession);

ShiftSessionSchema.index({ tenantId: 1, startedAt: -1 });
ShiftSessionSchema.index(
  { tenantId: 1, userId: 1, endedAt: 1 },
  { partialFilterExpression: { endedAt: null } },
);

applyTenantPlugin(ShiftSessionSchema);
