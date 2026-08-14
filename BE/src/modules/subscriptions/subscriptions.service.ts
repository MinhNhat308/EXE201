import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { TenantStatus } from '../../common/enums/tenant-status.enum';
import {
  PLAN_LIMITS,
  SUBSCRIPTION_PERIOD_DAYS,
  TRIAL_DAYS,
} from '../../common/saas/plan-limits';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async findByTenantId(tenantId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ tenantId: new Types.ObjectId(tenantId) })
      .exec();
  }

  async createTrialSubscription(tenantId: string): Promise<SubscriptionDocument> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);
    const limits = PLAN_LIMITS[SubscriptionPlan.PREMIUM];

    return new this.subscriptionModel({
      tenantId: new Types.ObjectId(tenantId),
      plan: SubscriptionPlan.PREMIUM,
      status: SubscriptionStatus.TRIAL,
      startedAt: now,
      expiresAt,
      maxEmployees: limits.maxEmployees,
      maxBranches: limits.maxBranches,
      trialUsed: true,
    }).save();
  }

  async createLegacyActiveSubscription(
    tenantId: string,
    plan: SubscriptionPlan = SubscriptionPlan.PREMIUM,
  ): Promise<SubscriptionDocument> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 10);
    const limits = PLAN_LIMITS[plan];

    return new this.subscriptionModel({
      tenantId: new Types.ObjectId(tenantId),
      plan,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      expiresAt,
      maxEmployees: limits.maxEmployees,
      maxBranches: limits.maxBranches,
      trialUsed: false,
    }).save();
  }

  async syncExpiredStatus(
    tenant: TenantDocument,
    sub: SubscriptionDocument,
  ): Promise<SubscriptionDocument> {
    const now = new Date();
    if (sub.status === SubscriptionStatus.SUSPENDED) {
      return sub;
    }

    if (sub.expiresAt < now) {
      sub.status = SubscriptionStatus.EXPIRED;
      await sub.save();
      tenant.status = TenantStatus.EXPIRED;
      await tenant.save();
    } else if (
      sub.status === SubscriptionStatus.TRIAL &&
      tenant.trialExpiredAt &&
      tenant.trialExpiredAt < now
    ) {
      sub.status = SubscriptionStatus.EXPIRED;
      await sub.save();
      tenant.status = TenantStatus.EXPIRED;
      await tenant.save();
    }

    return sub;
  }

  daysLeft(sub: SubscriptionDocument): number {
    const diff = sub.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  async getForTenant(tenantId: string) {
    const sub = await this.findByTenantId(tenantId);
    if (!sub) throw new NotFoundException('Không tìm thấy gói đăng ký');
    return sub;
  }

  async upgrade(tenantId: string, plan: SubscriptionPlan) {
    const sub = await this.getForTenant(tenantId);
    const limits = PLAN_LIMITS[plan];
    sub.plan = plan;
    sub.maxEmployees = limits.maxEmployees;
    sub.maxBranches = limits.maxBranches;
    return sub.save();
  }

  async activateAfterPayment(
    tenantId: string,
    plan: SubscriptionPlan,
    days = SUBSCRIPTION_PERIOD_DAYS,
  ) {
    const [tenant, sub] = await Promise.all([
      this.tenantModel.findById(tenantId).exec(),
      this.getForTenant(tenantId),
    ]);
    if (!tenant) throw new NotFoundException('Tenant không tồn tại');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + days);

    sub.plan = plan;
    sub.status = SubscriptionStatus.ACTIVE;
    sub.startedAt = now;
    sub.expiresAt = expiresAt;
    const limits = PLAN_LIMITS[plan];
    sub.maxEmployees = limits.maxEmployees;
    sub.maxBranches = limits.maxBranches;
    await sub.save();

    tenant.status = TenantStatus.ACTIVE;
    tenant.packageType = plan;
    tenant.subscriptionExpiredAt = expiresAt;
    await tenant.save();

    return sub;
  }

  async countEmployees(tenantId: string, userModel: Model<{ tenantId?: Types.ObjectId }>) {
    return userModel
      .countDocuments({ tenantId: new Types.ObjectId(tenantId) })
      .exec();
  }

  assertCanAddEmployee(sub: SubscriptionDocument, currentCount: number) {
    if (sub.plan === SubscriptionPlan.SOLO) {
      throw new BadRequestException(
        'Gói Solo chỉ có 1 tài khoản chủ cửa hàng. Nâng cấp Store để thêm nhân viên.',
      );
    }
    if (currentCount >= sub.maxEmployees) {
      throw new BadRequestException(
        `Đã đạt giới hạn ${sub.maxEmployees} nhân viên của gói hiện tại. Vui lòng nâng cấp gói.`,
      );
    }
  }

  async applyActivePlan(tenantId: string, plan: SubscriptionPlan) {
    const sub = await this.getForTenant(tenantId);
    const limits = PLAN_LIMITS[plan];
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    sub.plan = plan;
    sub.status = SubscriptionStatus.ACTIVE;
    sub.maxEmployees = limits.maxEmployees;
    sub.maxBranches = limits.maxBranches;
    sub.expiresAt = expiresAt;
    await sub.save();

    await this.tenantModel
      .findByIdAndUpdate(tenantId, {
        packageType: plan,
        status: TenantStatus.ACTIVE,
        subscriptionExpiredAt: expiresAt,
      })
      .exec();

    return sub;
  }
}
