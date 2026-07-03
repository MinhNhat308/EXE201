import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessModel } from '../common/enums/business-model.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';
import { SubscriptionPlan } from '../common/enums/subscription-plan.enum';
import { TenantStatus } from '../common/enums/tenant-status.enum';
import { WorkShift } from '../common/enums/work-shift.enum';
import { DEMO_PLAN_BY_SLUG, TRIAL_DAYS } from '../common/saas/plan-limits';
import { Branch, BranchDocument } from '../modules/branches/schemas/branch.schema';
import { MenuItem, MenuItemDocument } from '../modules/menu/schemas/menu-item.schema';
import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';
import { SubscriptionsService } from '../modules/subscriptions/subscriptions.service';
import { TenantOnboardingService } from '../modules/tenants/tenant-onboarding.service';
import { TenantsService } from '../modules/tenants/tenants.service';
import { Tenant, TenantDocument } from '../modules/tenants/schemas/tenant.schema';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { UsersService } from '../modules/users/users.service';
import { DEMO_SEED_DEFAULTS } from './demo-defaults';
import { DemoInventorySeedService } from './demo-inventory.seed.service';
import { DemoStoreReportsSeedService } from './demo-store-reports.seed.service';
import { DemoChainBranchSetupService } from './demo-chain-branch-setup.seed.service';
import { DemoChainReportsSeedService } from './demo-chain-reports.seed.service';
import { DemoChainOperationsSeedService } from './demo-chain-operations.seed.service';

const CHAIN_BRANCHES = [
  { code: 'CN-Q1', name: 'Chi nhánh Quận 1' },
  { code: 'CN-Q7', name: 'Chi nhánh Quận 7' },
  { code: 'CN-TD', name: 'Chi nhánh Thủ Đức' },
];

const STORE_EMPLOYEES: {
  email: string;
  name: string;
  role: Role;
  username: string;
}[] = [
  { email: 'store-cashier@bobapos.test', name: 'Thu ngân', role: Role.STAFF, username: 'cashier' },
  { email: 'store-kitchen@bobapos.test', name: 'Bếp', role: Role.KITCHEN, username: 'kitchen' },
  { email: 'store-manager@bobapos.test', name: 'Quản lý ca', role: Role.STORE_MANAGER, username: 'manager' },
  { email: 'store-accounting@bobapos.test', name: 'Kế toán', role: Role.ACCOUNTING, username: 'accounting' },
  { email: 'store-warehouse@bobapos.test', name: 'Thủ kho', role: Role.WAREHOUSE, username: 'warehouse' },
];

const CHAIN_BRANCH_ASSIGN: Record<string, string> = {
  cashier1: 'CN-Q1',
  cashier2: 'CN-Q7',
  kitchen: 'MAIN',
  warehouse: 'MAIN',
  accounting: 'MAIN',
  manager: 'MAIN',
};

const CHAIN_EMPLOYEES: {
  email: string;
  name: string;
  role: Role;
  username: string;
}[] = [
  { email: 'chain-cashier1@bobapos.test', name: 'Thu ngân 1', role: Role.STAFF, username: 'cashier1' },
  { email: 'chain-cashier2@bobapos.test', name: 'Thu ngân 2', role: Role.STAFF, username: 'cashier2' },
  { email: 'chain-kitchen@bobapos.test', name: 'Bếp trưởng', role: Role.KITCHEN, username: 'kitchen' },
  { email: 'chain-warehouse@bobapos.test', name: 'Thủ kho', role: Role.WAREHOUSE, username: 'warehouse' },
  {
    email: 'chain-accounting@bobapos.test',
    name: 'Kế toán',
    role: Role.ACCOUNTING,
    username: 'accounting',
  },
  {
    email: 'chain-manager@bobapos.test',
    name: 'Quản lý ca',
    role: Role.STORE_MANAGER,
    username: 'manager',
  },
];

@Injectable()
export class DemoTenantsSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoTenantsSeedService.name);

  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name) private readonly menuModel: Model<MenuItemDocument>,
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly onboardingService: TenantOnboardingService,
    private readonly usersService: UsersService,
    private readonly demoInventorySeed: DemoInventorySeedService,
    private readonly demoStoreReportsSeed: DemoStoreReportsSeedService,
    private readonly demoChainBranchSetup: DemoChainBranchSetupService,
    private readonly demoChainReportsSeed: DemoChainReportsSeedService,
    private readonly demoChainOperationsSeed: DemoChainOperationsSeedService,
  ) {}

  async onApplicationBootstrap() {
    if (this.configService.get<string>('SEED_DEMO_TENANTS') === 'false') return;

    const chainEmail =
      this.configService.get<string>('SEED_DEMO_CHAIN_EMAIL') ??
      DEMO_SEED_DEFAULTS.chain.email;
    const chainPassword =
      this.configService.get<string>('SEED_DEMO_CHAIN_PASSWORD') ??
      DEMO_SEED_DEFAULTS.chain.password;
    const chainName =
      this.configService.get<string>('SEED_DEMO_CHAIN_NAME') ??
      DEMO_SEED_DEFAULTS.chain.name;

    const soloEmail =
      this.configService.get<string>('SEED_DEMO_SOLO_EMAIL') ??
      DEMO_SEED_DEFAULTS.solo.email;
    const soloPassword =
      this.configService.get<string>('SEED_DEMO_SOLO_PASSWORD') ??
      DEMO_SEED_DEFAULTS.solo.password;
    const soloName =
      this.configService.get<string>('SEED_DEMO_SOLO_NAME') ??
      DEMO_SEED_DEFAULTS.solo.name;

    const storeEmail =
      this.configService.get<string>('SEED_DEMO_STORE_EMAIL') ??
      DEMO_SEED_DEFAULTS.store.email;
    const storePassword =
      this.configService.get<string>('SEED_DEMO_STORE_PASSWORD') ??
      DEMO_SEED_DEFAULTS.store.password;
    const storeName =
      this.configService.get<string>('SEED_DEMO_STORE_NAME') ??
      DEMO_SEED_DEFAULTS.store.name;

    const demos = [
      {
        slug: 'demo-chain',
        storeName: DEMO_SEED_DEFAULTS.chain.storeName,
        businessModel: BusinessModel.LARGE,
        ownerEmail: chainEmail,
        ownerPassword: chainPassword,
        ownerName: chainName,
        extraBranches: CHAIN_BRANCHES,
        employees: CHAIN_EMPLOYEES.map((e) => ({
          ...e,
          password: chainPassword,
        })),
        log: 'CHAIN (chuỗi)',
      },
      {
        slug: 'demo-store',
        storeName: DEMO_SEED_DEFAULTS.store.storeName,
        businessModel: BusinessModel.SMALL,
        ownerEmail: storeEmail,
        ownerPassword: storePassword,
        ownerName: storeName,
        employees: STORE_EMPLOYEES.map((e) => ({
          ...e,
          password: storePassword,
        })),
        log: 'STORE (cửa hàng + NV)',
      },
      {
        slug: 'demo-solo',
        storeName: DEMO_SEED_DEFAULTS.solo.storeName,
        businessModel: BusinessModel.SMALL,
        ownerEmail: soloEmail,
        ownerPassword: soloPassword,
        ownerName: soloName,
        log: 'SOLO (một mình)',
      },
    ] as Array<{
      slug: string;
      storeName: string;
      businessModel: BusinessModel;
      ownerEmail: string;
      ownerPassword: string;
      ownerName: string;
      extraBranches?: { code: string; name: string }[];
      employees?: { email: string; password: string; name: string; role: Role; username: string }[];
      log: string;
    }>;

    for (const demo of demos) {
      try {
        await this.ensureDemoTenant(demo);
        this.logger.log(`Đã kiểm tra / tạo demo ${demo.log}`);
      } catch (err) {
        this.logger.error(`Lỗi seed demo ${demo.slug}`, err);
      }
    }
  }

  private async ensureDemoTenant(input: {
    slug: string;
    storeName: string;
    businessModel: BusinessModel;
    ownerEmail: string;
    ownerPassword: string;
    ownerName: string;
    extraBranches?: { code: string; name: string }[];
    employees?: { email: string; password: string; name: string; role: Role; username: string }[];
  }) {
    let tenant = await this.tenantsService.findBySlug(input.slug);
    if (!tenant) {
      const now = new Date();
      const trialExpiredAt = new Date(now);
      trialExpiredAt.setDate(trialExpiredAt.getDate() + TRIAL_DAYS);

      tenant = await this.tenantModel.create({
        storeName: input.storeName,
        slug: input.slug,
        businessModel: input.businessModel,
        intendedPlan: DEMO_PLAN_BY_SLUG[input.slug],
        packageType: SubscriptionPlan.PREMIUM,
        status: TenantStatus.TRIAL,
        trialExpiredAt,
      });

      await this.subscriptionsService.createTrialSubscription(tenant._id.toString());
      await this.onboardingService.seedTenantData(tenant._id.toString());
    }

    const tenantId = tenant._id.toString();

    const sub = await this.subscriptionsService.findByTenantId(tenantId);
    if (!sub) {
      await this.subscriptionsService.createTrialSubscription(tenantId);
    }

    await this.usersService.seedUserIfNotExists(
      input.ownerEmail,
      input.ownerPassword,
      input.ownerName,
      Role.ADMIN,
      { tenantId, phone: '0909000100', resetPassword: true },
    );

    let owner = await this.userModel
      .findOne({ tenantId: tenant._id, email: input.ownerEmail.toLowerCase() })
      .exec();

    if (!owner) {
      owner = await this.userModel
        .findOne({ tenantId: tenant._id, role: Role.ADMIN })
        .exec();
    }

    if (owner) {
      await this.tenantsService.attachOwner(tenantId, owner._id.toString());
    }

    if (input.extraBranches?.length) {
      for (const b of input.extraBranches) {
        const exists = await this.branchModel
          .findOne({ tenantId: tenant._id, code: b.code })
          .exec();
        if (!exists) {
          await this.branchModel.create({
            tenantId: tenant._id,
            code: b.code,
            name: b.name,
            isDefault: false,
            isActive: true,
          });
        }
      }
    }

    if (input.employees?.length) {
      for (const emp of input.employees) {
        try {
          await this.usersService.seedUserIfNotExists(
            emp.email,
            emp.password,
            emp.name,
            emp.role,
            { tenantId, username: emp.username, resetPassword: true },
          );
        } catch (err) {
          this.logger.warn(
            `Bỏ qua NV demo ${emp.username}@${input.slug}: ${(err as Error).message}`,
          );
        }
      }
    }

    await this.applyDemoSegmentPlan(tenantId, input.slug);

    if (this.configService.get<string>('SEED_DEMO_INVENTORY') !== 'false') {
      try {
        await this.demoInventorySeed.enrichTenant(tenantId, input.slug);
      } catch (err) {
        this.logger.warn(`Enrich kho demo ${input.slug}: ${(err as Error).message}`);
      }
    }

    await this.tenantsService.markOnboardingComplete(tenantId);

    if (input.slug === 'demo-solo') {
      await this.seedSoloTodayOrders(tenantId);
    }

    if (input.slug === 'demo-chain') {
      await this.assignChainEmployeeBranches(tenant._id);
      await this.tenantsService.updateProfile(tenantId, {
        taxCode: '0312999888',
        invoiceTemplate: '1',
        invoiceSerial: 'C26TBB',
        vatRate: 8,
        address: '45 Lê Lợi, Q.1, TP.HCM — Trụ sở chuỗi',
        phone: '02838221122',
      });
      try {
        await this.demoChainBranchSetup.setupChainBranches(tenantId);
        await this.demoChainReportsSeed.seedChainReportData(tenantId);
        await this.demoChainOperationsSeed.seedChainOperations(tenantId);
      } catch (err) {
        this.logger.warn(`Seed luồng chain demo: ${(err as Error).message}`);
      }
    }

    if (input.slug === 'demo-store') {
      await this.tenantsService.updateProfile(tenantId, {
        taxCode: '0312345678',
        invoiceTemplate: '1',
        invoiceSerial: 'C26TAA',
        vatRate: 8,
        address: '123 Nguyễn Huệ, Q.1, TP.HCM',
        phone: '02838223344',
      });
      try {
        await this.demoStoreReportsSeed.seedReportData(tenantId);
      } catch (err) {
        this.logger.warn(`Seed luồng store demo: ${(err as Error).message}`);
      }
    }
  }

  /** Đơn hôm nay thật trên DB — Hub / Hóa đơn Solo có số liệu ngay */
  private async seedSoloTodayOrders(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const prefix = 'SOLO-DEMO-';
    const exists = await this.orderModel
      .countDocuments({ tenantId: tid, orderNumber: { $regex: `^${prefix}` } })
      .exec();
    if (exists > 0) return;

    const staff = await this.userModel
      .findOne({ tenantId: tid, role: Role.ADMIN, isActive: true })
      .exec();
    const menu = await this.menuModel
      .find({ tenantId: tid, isAvailable: true })
      .sort({ category: 1, name: 1 })
      .limit(6)
      .exec();
    if (!staff || menu.length < 3) {
      this.logger.warn('Bỏ qua seed đơn Solo — chưa có admin hoặc menu');
      return;
    }

    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

    const samples: { suffix: string; items: MenuItemDocument[]; table: string; hour: number }[] = [
      { suffix: '001', items: menu.slice(0, 2), table: 'Mang đi', hour: 8 },
      { suffix: '002', items: [menu[2]], table: 'Mang đi', hour: 10 },
      { suffix: '003', items: menu.slice(1, 4), table: 'Mang đi', hour: 14 },
      { suffix: '004', items: [menu[0], menu[3]], table: 'Mang đi', hour: 16 },
    ];

    let seq = 1;
    for (const s of samples) {
      const lines = s.items.map((m) => ({
        menuItemId: m._id,
        name: m.name,
        basePrice: m.price,
        toppings: [],
        price: m.price,
        quantity: 1,
      }));
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      const createdAt = new Date(today);
      createdAt.setHours(s.hour, 15 + seq, 0, 0);

      await this.orderModel.create({
        tenantId: tid,
        orderNumber: `${prefix}${s.suffix}`,
        invoiceNumber: `${datePrefix}${String(seq).padStart(4, '0')}`,
        dailySequence: seq,
        items: lines,
        tableNumber: s.table,
        paymentMethod: 'CASH',
        workShift: WorkShift.MORNING,
        staffId: staff._id,
        staffName: staff.fullName,
        subtotal,
        total: subtotal,
        status: OrderStatus.COMPLETED,
        inventoryDeducted: true,
        createdAt,
        updatedAt: createdAt,
      });
      seq += 1;
    }

    this.logger.log(`Đã seed ${samples.length} đơn Solo hôm nay (${prefix}*)`);
  }

  private async assignChainEmployeeBranches(tenantOid: Types.ObjectId) {
    const branches = await this.branchModel.find({ tenantId: tenantOid }).exec();
    const byCode = Object.fromEntries(branches.map((b) => [b.code, b._id]));
    for (const [username, code] of Object.entries(CHAIN_BRANCH_ASSIGN)) {
      const branchId = byCode[code];
      if (!branchId) continue;
      await this.userModel
        .updateOne(
          { tenantId: tenantOid, username },
          { $set: { branchId } },
        )
        .exec();
    }
  }

  /** Demo thuyết trình: ACTIVE đúng gói SOLO / STORE / CHAIN (không trial full) */
  private async applyDemoSegmentPlan(tenantId: string, slug: string) {
    const plan = DEMO_PLAN_BY_SLUG[slug];
    if (!plan) return;
    await this.subscriptionsService.applyActivePlan(tenantId, plan);
    this.logger.log(`Đã gán gói ${plan} cho tenant demo ${slug}`);
  }
}
