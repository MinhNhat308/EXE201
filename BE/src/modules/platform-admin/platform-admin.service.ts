import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { TenantStatus } from '../../common/enums/tenant-status.enum';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantsService } from '../tenants/tenants.service';

const STATUS_MAP: Record<string, { tenant: TenantStatus; subscription: SubscriptionStatus }> = {
  active: { tenant: TenantStatus.ACTIVE, subscription: SubscriptionStatus.ACTIVE },
  inactive: { tenant: TenantStatus.EXPIRED, subscription: SubscriptionStatus.EXPIRED },
  pending: { tenant: TenantStatus.TRIAL, subscription: SubscriptionStatus.TRIAL },
  suspended: { tenant: TenantStatus.SUSPENDED, subscription: SubscriptionStatus.SUSPENDED },
};

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async updateTenant(id: string, payload: Record<string, unknown>) {
    let tenant = await this.tenantsService.findById(id);
    const subscription = await this.subscriptionsService.getForTenant(id);

    if (payload.name || payload.address !== undefined || payload.ownerPhone !== undefined) {
      tenant = await this.tenantsService.updateProfile(id, {
        storeName: payload.name ? String(payload.name) : undefined,
        address: payload.address !== undefined ? String(payload.address) : undefined,
        phone: payload.ownerPhone !== undefined ? String(payload.ownerPhone) : undefined,
      });
    }

    if (payload.plan) {
      const plan = String(payload.plan).toUpperCase() as SubscriptionPlan;
      if (Object.values(SubscriptionPlan).includes(plan)) {
        await this.subscriptionsService.upgrade(id, plan);
        tenant.packageType = plan;
      }
    }

    if (payload.status) {
      const status = STATUS_MAP[String(payload.status).toLowerCase()];
      if (status) {
        tenant.status = status.tenant;
        subscription.status = status.subscription;
        if (status.subscription === SubscriptionStatus.ACTIVE && subscription.expiresAt.getTime() <= Date.now()) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          subscription.startedAt = new Date();
          subscription.expiresAt = expiresAt;
          tenant.subscriptionExpiredAt = expiresAt;
        }
      }
    }

    await Promise.all([tenant.save(), subscription.save()]);
    return { tenant: tenant.toJSON(), subscription: subscription.toJSON() };
  }

  async suspendTenant(id: string) {
    return this.updateTenant(id, { status: 'suspended' });
  }
}
