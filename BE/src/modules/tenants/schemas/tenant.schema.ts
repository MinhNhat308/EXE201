import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BusinessModel } from '../../../common/enums/business-model.enum';
import { SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';
import { TenantStatus } from '../../../common/enums/tenant-status.enum';

export type TenantDocument = Tenant & Document;

@Schema({ _id: false })
export class TenantSettings {
  @Prop()
  logoUrl?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop({ default: 'Asia/Ho_Chi_Minh' })
  timezone?: string;

  /** Hoàn tất wizard thiết lập lần đầu */
  @Prop()
  onboardingCompletedAt?: Date;

  /** Solo: bật trừ kho theo công thức (false = chỉ quản lý hóa đơn) */
  @Prop({ default: true })
  trackInventory?: boolean;

  /** POS Solo: hỏi % đường khi bán (công thức quán = 100%) */
  @Prop({ default: true })
  posSugarChoiceEnabled?: boolean;

  /** POS Solo: hỏi % đá khi bán */
  @Prop({ default: true })
  posIceChoiceEnabled?: boolean;

  /** Các mức % đường hiện trên POS (VD: 25, 50, 75, 100) */
  @Prop({ type: [Number], default: [0, 25, 50, 75, 100] })
  sugarLevels?: number[];

  /** Các mức % đá hiện trên POS (VD: 20, 30, 60) */
  @Prop({ type: [Number], default: [0, 25, 50, 75, 100] })
  iceLevels?: number[];

  /** MST / mã số thuế — in trên hóa đơn & báo cáo HĐĐT */
  @Prop({ trim: true })
  taxCode?: string;

  /** Mẫu số hóa đơn (VD: 1C24TAA) */
  @Prop({ trim: true })
  invoiceTemplate?: string;

  /** Ký hiệu hóa đơn (VD: AA/24E) */
  @Prop({ trim: true })
  invoiceSerial?: string;

  /** Thuế GTGT % — mặc định 8 (F&B VN) */
  @Prop({ default: 8 })
  vatRate?: number;
}

export const TenantSettingsSchema = SchemaFactory.createForClass(TenantSettings);

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, trim: true })
  storeName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ enum: SubscriptionPlan })
  intendedPlan?: SubscriptionPlan;

  @Prop({ required: true, enum: BusinessModel, default: BusinessModel.SMALL })
  businessModel: BusinessModel;

  @Prop({ required: true, enum: SubscriptionPlan, default: SubscriptionPlan.PREMIUM })
  packageType: SubscriptionPlan;

  @Prop({ required: true, enum: TenantStatus, default: TenantStatus.TRIAL })
  status: TenantStatus;

  @Prop()
  trialExpiredAt?: Date;

  @Prop()
  subscriptionExpiredAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerUserId?: Types.ObjectId;

  @Prop({ type: TenantSettingsSchema, default: {} })
  settings: TenantSettings;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.set('toJSON', {
  transform: (_doc, ret) => ({
    id: ret._id?.toString(),
    storeName: ret.storeName,
    slug: ret.slug,
    businessModel: ret.businessModel,
    intendedPlan: ret.intendedPlan,
    packageType: ret.packageType,
    status: ret.status,
    trialExpiredAt: ret.trialExpiredAt,
    subscriptionExpiredAt: ret.subscriptionExpiredAt,
    ownerUserId: ret.ownerUserId?.toString(),
    settings: ret.settings,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  }),
});
