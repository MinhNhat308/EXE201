import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class PasskeyCredential {
  @Prop({ required: true })
  credentialId: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true, default: 0 })
  counter: number;

  @Prop()
  deviceName?: string;

  @Prop({ type: [String], default: [] })
  transports?: string[];
}

@Schema({ timestamps: true, collection: "platform_users" })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, default: "admin" })
  role: string;

  @Prop()
  tenantId?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop()
  resetCode?: string;

  @Prop()
  resetCodeExpiresAt?: Date;

  @Prop({ type: [PasskeyCredential], default: [] })
  passkeys: PasskeyCredential[];

  @Prop({ type: [String], default: [] })
  ssoProviders: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
