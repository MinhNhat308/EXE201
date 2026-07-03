import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { QueryParams } from '../common/types';
import {
  BobaposBillingInvoice,
  BobaposBillingInvoiceDocument,
  BobaposSubscription,
  BobaposSubscriptionDocument,
  BobaposTenant,
  BobaposTenantDocument,
  BobaposUser,
  BobaposUserDocument,
} from './bobapos.schema';
import {
  BOBAPOS_PLAN_DEFINITIONS,
  mapAdminPlanToBobapos,
  mapBobaposInvoiceStatus,
  mapBobaposPlanToAdmin,
  mapBobaposRoleToEmployeeRole,
  mapBobaposTenantStatus,
  planLabel,
  planPriceVnd,
} from './bobapos.mapper';

export type AdminTenantDto = Record<string, unknown>;

@Injectable()
export class BobaposBridgeService {
  constructor(
    @InjectModel(BobaposTenant.name)
    private readonly tenantModel: Model<BobaposTenantDocument>,
    @InjectModel(BobaposSubscription.name)
    private readonly subscriptionModel: Model<BobaposSubscriptionDocument>,
    @InjectModel(BobaposUser.name)
    private readonly bobaposUserModel: Model<BobaposUserDocument>,
    @InjectModel(BobaposBillingInvoice.name)
    private readonly invoiceModel: Model<BobaposBillingInvoiceDocument>,
  ) {}

  async findAllTenants(params: QueryParams) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const search = String(params.search ?? '').trim().toLowerCase();

    const [rawTenants, subs, owners] = await Promise.all([
      this.tenantModel.find().sort({ createdAt: -1 }).lean().exec(),
      this.subscriptionModel.find().lean().exec(),
      this.bobaposUserModel.find({ role: 'ADMIN' }).lean().exec(),
    ]);

    const subByTenant = new Map(subs.map((s) => [String(s.tenantId), s]));
    const ownerByTenant = new Map(
      owners.filter((u) => u.tenantId).map((u) => [String(u.tenantId), u]),
    );
    const ownerById = new Map(
      owners.filter((u) => u._id).map((u) => [String(u._id), u]),
    );

    let rows = rawTenants.map((t) =>
      this.toTenantDto(t, subByTenant.get(String(t._id)), ownerByTenant.get(String(t._id)) ?? (t.ownerUserId ? ownerById.get(String(t.ownerUserId)) : undefined)),
    );

    if (search) {
      rows = rows.filter((row) =>
        ['name', 'ownerName', 'ownerEmail', 'plan', 'status', 'slug', 'address', 'location']
          .some((key) => String(row[key] ?? '').toLowerCase().includes(search)),
      );
    }

    const statusFilter = params.filters?.status ?? params.status;
    if (statusFilter) {
      rows = rows.filter((row) => row.status === statusFilter);
    }

    const planFilter = params.filters?.plan ?? params.plan;
    if (planFilter) {
      rows = rows.filter((row) => row.plan === planFilter);
    }

    const total = rows.length;
    const skip = (page - 1) * limit;
    const data = rows.slice(skip, skip + limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOneTenant(id: string): Promise<AdminTenantDto> {
    const tenant = await this.tenantModel.findById(id).lean().exec();
    if (!tenant) throw new NotFoundException('Tenant not found');

    const [sub, owner] = await Promise.all([
      this.subscriptionModel.findOne({ tenantId: tenant._id }).lean().exec(),
      this.resolveOwner(tenant),
    ]);

    return this.toTenantDto(tenant, sub ?? undefined, owner ?? undefined);
  }

  async updateTenant(id: string, payload: Record<string, unknown>): Promise<AdminTenantDto> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (payload.name) tenant.set('storeName', payload.name);
    if (payload.address) tenant.set('settings.address', payload.address);
    if (payload.ownerPhone) tenant.set('settings.phone', payload.ownerPhone);

    if (payload.status) {
      const reverse: Record<string, string> = {
        active: 'ACTIVE',
        inactive: 'EXPIRED',
        suspended: 'SUSPENDED',
        pending: 'TRIAL',
      };
      tenant.set('status', reverse[String(payload.status)] ?? 'TRIAL');
    }

    if (payload.plan) {
      const bobPlan = mapAdminPlanToBobapos(String(payload.plan));
      tenant.set('packageType', bobPlan);
      await this.subscriptionModel
        .updateOne({ tenantId: tenant._id }, { $set: { plan: bobPlan } })
        .exec();
    }

    await tenant.save();
    return this.findOneTenant(id);
  }

  async removeTenant(id: string) {
    await this.tenantModel.findByIdAndDelete(id).exec();
    await Promise.all([
      this.subscriptionModel.deleteMany({ tenantId: new Types.ObjectId(id) }).exec(),
      this.bobaposUserModel.deleteMany({ tenantId: new Types.ObjectId(id) }).exec(),
      this.invoiceModel.deleteMany({ tenantId: new Types.ObjectId(id) }).exec(),
    ]);
  }

  async getDashboardOverview() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const [tenants, subs, invoices, employees] = await Promise.all([
      this.tenantModel.find().lean().exec(),
      this.subscriptionModel.find().lean().exec(),
      this.invoiceModel.find().lean().exec(),
      this.bobaposUserModel.find({ role: { $ne: 'ADMIN' }, tenantId: { $exists: true } }).lean().exec(),
    ]);

    const activeTenants = tenants.filter((t) => mapBobaposTenantStatus(t.status) === 'active');
    const activeEmployees = employees.filter((e) => e.isActive !== false);

    const expiringSoon = subs.filter((s) => {
      if (!s.expiresAt) return false;
      const exp = new Date(s.expiresAt);
      return exp >= now && exp <= thirtyDaysFromNow;
    }).length;

    const planCounts = new Map<string, number>();
    for (const s of subs) {
      const key = mapBobaposPlanToAdmin(s.plan);
      planCounts.set(key, (planCounts.get(key) ?? 0) + 1);
    }

    const registrationTrends = this.buildRegistrationTrends(tenants, now);
    const revenue = this.buildRevenue(invoices, now);
    const recentTenants = tenants
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 4);

    return {
      metrics: [
        { key: 'owners', label: 'Chủ cửa hàng active', value: activeTenants.length, detail: `${tenants.length} tổng cửa hàng` },
        { key: 'stores', label: 'Cửa hàng', value: tenants.length, detail: `${activeTenants.length} đang active` },
        { key: 'employees', label: 'Nhân viên active', value: activeEmployees.length, detail: `${employees.length} tổng NV` },
        { key: 'contractsExpiringSoon', label: 'Gói sắp hết hạn', value: expiringSoon, detail: '30 ngày tới' },
      ],
      registrationTrends,
      planOverview: [...planCounts.entries()].map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
      })),
      recentActivities: [
        ...recentTenants.map((t) => ({
          id: `tenant-${t._id}`,
          activity: 'Cửa hàng đăng ký',
          user: 'BOBAPOS',
          target: t.storeName ?? t.slug,
          status: mapBobaposTenantStatus(t.status),
          createdAt: (t.createdAt ?? new Date()).toISOString(),
        })),
        ...invoices.slice(-4).map((inv) => ({
          id: `inv-${inv._id}`,
          activity: 'Hóa đơn gói',
          user: 'Billing',
          target: `${planLabel(inv.plan)} · ${Number(inv.amount ?? 0).toLocaleString('vi-VN')}₫`,
          status: mapBobaposInvoiceStatus(inv.status),
          createdAt: (inv.createdAt ?? new Date()).toISOString(),
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
      revenue,
      health: { api: 'Operational', database: 'BOBAPOS shared', server: 'Stable' },
    };
  }

  async getSubscriptionPlansOverview() {
    const [tenants, subs, invoices] = await Promise.all([
      this.tenantModel.find().lean().exec(),
      this.subscriptionModel.find().lean().exec(),
      this.invoiceModel.find().lean().exec(),
    ]);

    const subByTenant = new Map(subs.map((s) => [String(s.tenantId), s]));

    const plans = BOBAPOS_PLAN_DEFINITIONS.map((def) => {
      const bobPlan = mapAdminPlanToBobapos(def.value);
      const planTenants = tenants.filter((t) => {
        const sub = subByTenant.get(String(t._id));
        const plan = sub?.plan ?? t.packageType;
        return mapBobaposPlanToAdmin(plan) === def.value;
      });
      const tenantIds = new Set(planTenants.map((t) => String(t._id)));
      const planInvoices = invoices.filter((inv) => tenantIds.has(String(inv.tenantId)));
      const activeOwners = planTenants.filter((t) => mapBobaposTenantStatus(t.status) === 'active').length;
      const contractAmount = planInvoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0);

      return {
        id: def.value,
        ...def,
        owners: planTenants.length,
        activeOwners,
        stores: planTenants.length,
        activeContracts: planInvoices.filter((inv) => inv.status === 'PAID').length,
        contractAmount,
      };
    });

    const contractAmountByPlan: Record<string, number> = {};
    for (const inv of invoices.filter((i) => i.status === 'PAID')) {
      const key = mapBobaposPlanToAdmin(inv.plan);
      contractAmountByPlan[key] = (contractAmountByPlan[key] ?? 0) + Number(inv.amount ?? 0);
    }

    return {
      metrics: [
        { label: 'Gói đang bán', value: plans.length },
        { label: 'Chủ cửa hàng', value: tenants.length },
        { label: 'Cửa hàng', value: tenants.length },
        { label: 'Hóa đơn đã thanh toán', value: invoices.filter((i) => i.status === 'PAID').length },
      ],
      plans,
      contractAmountByPlan,
    };
  }

  async findAllInvoices(params: QueryParams) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const search = String(params.search ?? '').trim().toLowerCase();

    const [invoices, tenants, owners] = await Promise.all([
      this.invoiceModel.find().sort({ createdAt: -1 }).lean().exec(),
      this.tenantModel.find().lean().exec(),
      this.bobaposUserModel.find({ role: 'ADMIN' }).lean().exec(),
    ]);

    const tenantById = new Map(tenants.map((t) => [String(t._id), t]));
    const ownerByTenant = new Map(
      owners.filter((u) => u.tenantId).map((u) => [String(u.tenantId), u]),
    );

    let rows = invoices.map((inv, index) => {
      const tenant = tenantById.get(String(inv.tenantId));
      const owner = ownerByTenant.get(String(inv.tenantId));
      const code = `BP-${new Date(inv.createdAt ?? Date.now()).getFullYear()}-${String(index + 1).padStart(4, '0')}`;
      return {
        id: String(inv._id),
        tenantId: String(inv.tenantId),
        code,
        ownerName: owner?.fullName ?? tenant?.storeName ?? '—',
        plan: mapBobaposPlanToAdmin(inv.plan),
        status: mapBobaposInvoiceStatus(inv.status),
        amount: Number(inv.amount ?? 0),
        startDate: inv.periodStart ? this.toDateInput(inv.periodStart) : this.toDateInput(inv.createdAt ?? new Date()),
        endDate: inv.periodEnd ? this.toDateInput(inv.periodEnd) : '',
        durationMonths: 1,
        additionalTerms: inv.note ?? '',
        paymentMethod: inv.paymentMethod ?? 'MANUAL',
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      };
    });

    if (search) {
      rows = rows.filter((row) =>
        ['code', 'ownerName', 'plan', 'status'].some((k) =>
          String(row[k as keyof typeof row] ?? '').toLowerCase().includes(search),
        ),
      );
    }

    const total = rows.length;
    const skip = (page - 1) * limit;
    return {
      data: rows.slice(skip, skip + limit),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOneInvoice(id: string) {
    const result = await this.findAllInvoices({ page: 1, limit: 10_000 });
    const row = result.data.find((r) => r.id === id);
    if (!row) throw new NotFoundException('Contract not found');
    return row;
  }

  async findAllEmployees(params: QueryParams) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const search = String(params.search ?? '').trim().toLowerCase();

    const [users, tenants] = await Promise.all([
      this.bobaposUserModel
        .find({ role: { $ne: 'ADMIN' }, tenantId: { $exists: true, $ne: null } })
        .lean()
        .exec(),
      this.tenantModel.find().lean().exec(),
    ]);

    const tenantById = new Map(tenants.map((t) => [String(t._id), t]));

    let rows = users.map((u) => ({
      id: String(u._id),
      tenantId: String(u.tenantId),
      fullName: u.fullName ?? '—',
      email: u.email ?? '',
      role: mapBobaposRoleToEmployeeRole(u.role),
      department: tenantById.get(String(u.tenantId))?.storeName ?? '—',
      status: u.isActive === false ? 'inactive' : 'active',
      lastLoginAt: null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    if (search) {
      rows = rows.filter((row) =>
        ['fullName', 'email', 'role', 'department'].some((k) =>
          String(row[k as keyof typeof row] ?? '').toLowerCase().includes(search),
        ),
      );
    }

    const total = rows.length;
    const skip = (page - 1) * limit;
    return {
      data: rows.slice(skip, skip + limit),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOneEmployee(id: string) {
    const result = await this.findAllEmployees({ page: 1, limit: 10_000 });
    const row = result.data.find((r) => r.id === id);
    if (!row) throw new NotFoundException('Employee not found');
    return row;
  }

  getPlanDefinitions() {
    return BOBAPOS_PLAN_DEFINITIONS;
  }

  private async resolveOwner(tenant: BobaposTenant & { _id: Types.ObjectId }) {
    if (tenant.ownerUserId) {
      return this.bobaposUserModel.findById(tenant.ownerUserId).lean().exec();
    }
    return this.bobaposUserModel
      .findOne({ tenantId: tenant._id, role: 'ADMIN' })
      .lean()
      .exec();
  }

  private toTenantDto(
    tenant: BobaposTenant & { _id: Types.ObjectId },
    sub?: BobaposSubscription,
    owner?: BobaposUser,
  ): AdminTenantDto {
    const plan = mapBobaposPlanToAdmin(sub?.plan ?? tenant.packageType);
    const settings = (tenant.settings ?? {}) as Record<string, unknown>;

    return {
      id: String(tenant._id),
      name: tenant.storeName ?? '—',
      slug: tenant.slug ?? '',
      ownerName: owner?.fullName ?? '—',
      ownerEmail: owner?.email ?? '—',
      ownerPhone: owner?.phone ?? String(settings.phone ?? ''),
      plan,
      status: mapBobaposTenantStatus(tenant.status),
      location: String(settings.address ?? ''),
      address: String(settings.address ?? ''),
      taxId: String(settings.taxCode ?? ''),
      accountRole: 'super_admin',
      softwareVersion: 'BOBAPOS',
      contractDurationMonths: 12,
      setupFee: 0,
      monthlyFee: planPriceVnd(sub?.plan ?? tenant.packageType),
      discount: 0,
      subscriptionStatus: sub?.status ?? null,
      subscriptionPlan: sub?.plan ?? tenant.packageType ?? null,
      expiresAt: sub?.expiresAt ?? tenant.subscriptionExpiredAt ?? null,
      trialExpiredAt: tenant.trialExpiredAt ?? null,
      maxEmployees: sub?.maxEmployees ?? null,
      maxBranches: sub?.maxBranches ?? null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  private buildRegistrationTrends(tenants: BobaposTenant[], now: Date) {
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleString('vi-VN', { month: 'short' }),
      };
    });
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const byMonth = new Map<string, { owners: number; stores: number }>();

    for (const t of tenants) {
      const created = t.createdAt ? new Date(t.createdAt) : null;
      if (!created || created < startDate) continue;
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(key) ?? { owners: 0, stores: 0 };
      cur.stores += 1;
      if (mapBobaposTenantStatus(t.status) === 'active') cur.owners += 1;
      byMonth.set(key, cur);
    }

    return months.map((m) => ({
      month: m.label,
      owners: byMonth.get(m.key)?.owners ?? 0,
      stores: byMonth.get(m.key)?.stores ?? 0,
    }));
  }

  private buildRevenue(invoices: BobaposBillingInvoice[], now: Date) {
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleString('vi-VN', { month: 'short' }),
      };
    });
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const byMonth = new Map<string, number>();

    for (const inv of invoices.filter((i) => i.status === 'PAID')) {
      const created = inv.createdAt ? new Date(inv.createdAt) : null;
      if (!created || created < startDate) continue;
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(inv.amount ?? 0));
    }

    const points = months.map((m) => ({ month: m.label, amount: byMonth.get(m.key) ?? 0 }));
    const monthlyRevenue = points[points.length - 1]?.amount ?? 0;
    const previousRevenue = points[points.length - 2]?.amount ?? 0;
    const growthRate =
      previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      monthlyRevenue,
      activeSubscriptions: invoices.filter((i) => i.status === 'PAID').length,
      growthRate,
      points,
    };
  }

  private toDateInput(date: Date) {
    return new Date(date).toISOString().slice(0, 10);
  }
}
