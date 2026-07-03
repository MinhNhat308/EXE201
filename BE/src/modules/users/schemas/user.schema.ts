import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

import { Role } from '../../../common/enums/role.enum';

import { applyTenantPlugin } from '../../../common/tenant/tenant-plugin';



export type UserDocument = User & Document;



@Schema({ timestamps: true, collection: 'users' })

export class User {

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true })

  tenantId?: Types.ObjectId;



  @Prop({ required: true, trim: true })

  fullName: string;



  @Prop({ required: true, lowercase: true, trim: true })

  email: string;



  @Prop({ trim: true, lowercase: true, sparse: true })

  username?: string;



  @Prop({ required: true })

  password: string;



  @Prop({ required: true, enum: Role })

  role: Role;



  @Prop({ trim: true })

  phone?: string;



  @Prop({ trim: true })

  address?: string;



  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId?: Types.ObjectId;

  @Prop({ default: true })

  isActive: boolean;



  createdAt?: Date;

  updatedAt?: Date;

}



export const UserSchema = SchemaFactory.createForClass(User);



UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

UserSchema.index(
  { tenantId: 1, username: 1 },
  {
    unique: true,
    partialFilterExpression: { username: { $exists: true, $type: 'string' } },
  },
);



applyTenantPlugin(UserSchema);



UserSchema.set('toJSON', {

  virtuals: true,

  transform: (_doc, ret) => {

    return {

      id: ret._id?.toString(),

      tenantId: ret.tenantId?.toString(),

      fullName: ret.fullName,

      email: ret.email,

      username: ret.username,

      role: ret.role,

      branchId: ret.branchId?.toString(),

      phone: ret.phone,

      address: ret.address,

      isActive: ret.isActive,

      createdAt: ret.createdAt,

      updatedAt: ret.updatedAt,

    };

  },

});


