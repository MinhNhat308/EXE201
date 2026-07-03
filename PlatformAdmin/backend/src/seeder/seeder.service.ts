import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../auth/user.schema";
import { hashPassword } from "../auth/password.util";
import { Contract, ContractDocument } from "../contracts/contract.schema";
import { Employee, EmployeeDocument } from "../employees/employee.schema";
import { License, LicenseDocument } from "../licenses/license.schema";
import {
  SubscriptionPlan,
  SubscriptionPlanDocument
} from "../subscription-plans/subscription-plan.schema";
import { Tenant, TenantDocument } from "../tenants/tenant.schema";

const TEST_PASSWORD = "Test@123456";
const DEMO_PASSWORD = "12345678";

const DEMO_USERS = [
  { email: "user1@teaflow.test", fullName: "Nguyen Van A", role: "admin" },
  { email: "user2@teaflow.test", fullName: "Tran Thi B", role: "super_admin" },
  { email: "user3@teaflow.test", fullName: "Le Van C", role: "manager" },
  { email: "user4@teaflow.test", fullName: "Pham Thi D", role: "manager" },
  { email: "user5@teaflow.test", fullName: "Hoang Van E", role: "staff" },
  { email: "user6@teaflow.test", fullName: "Vo Thi F", role: "staff" },
  { email: "user7@teaflow.test", fullName: "Dang Van G", role: "staff" },
  { email: "user8@teaflow.test", fullName: "Bui Thi H", role: "staff" },
  { email: "user9@teaflow.test", fullName: "Do Van I", role: "staff" },
  { email: "user10@teaflow.test", fullName: "Ngo Thi K", role: "staff" }
];

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(License.name) private readonly licenseModel: Model<LicenseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlanDocument>,
    private readonly config: ConfigService
  ) {}

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  async onModuleInit() {
    if (this.useBridge()) {
      await this.seedPlatformAdminOnly();
      this.logger.log("BOBAPOS bridge mode — đọc tenants/subscriptions từ DB POS");
      return;
    }

    await this.seedSubscriptionPlans();
    const tenants = await this.seedTenants();

    await Promise.all([
      this.seedUsers(tenants),
      this.seedContracts(tenants),
      this.seedEmployees(tenants),
      this.seedLicenses(tenants)
    ]);

    this.logger.log("Test data is ready");
  }

  /** Chỉ tạo tài khoản platform admin — không seed tenant demo khi dùng chung DB BOBAPOS */
  private async seedPlatformAdminOnly() {
    const email = "admin@bobapos.io";
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) return;

    await this.userModel.create({
      email,
      fullName: "BOBAPOS Platform Admin",
      role: "admin",
      isActive: true,
      passwordHash: hashPassword("Admin@123456"),
      ssoProviders: []
    });
    this.logger.log(`Platform admin seeded: ${email} / Admin@123456`);
  }

  private async seedSubscriptionPlans() {
    const plans = [
      {
        name: "Starter",
        value: "starter",
        price: "$49",
        description: "Gói cơ bản cho cửa hàng mới vận hành một chi nhánh.",
        status: "active",
        features: ["1 store", "3 employee seats", "Basic POS access", "Email support"]
      },
      {
        name: "Premium",
        value: "premium",
        price: "$129",
        description: "Gói tăng trưởng cho owner quản lý nhiều cửa hàng.",
        status: "active",
        features: ["Up to 5 stores", "25 employee seats", "Advanced reporting", "Priority support"]
      },
      {
        name: "Enterprise",
        value: "enterprise",
        price: "Custom",
        description: "Gói tùy chỉnh cho chuỗi lớn cần SLA và phân quyền nâng cao.",
        status: "active",
        features: ["Unlimited stores", "Custom employee seats", "Dedicated SLA", "Account manager"]
      },
      {
        name: "Legacy",
        value: "legacy",
        price: "$79",
        description: "Gói cũ đã ngừng bán, dùng để kiểm thử trạng thái inactive.",
        status: "inactive",
        features: ["1 store", "Legacy reports", "Email support"]
      }
    ];

    await Promise.all(
      plans.map((plan) =>
        this.subscriptionPlanModel
          .findOneAndUpdate({ value: plan.value }, { $set: plan }, { upsert: true, new: true, runValidators: true })
          .exec()
      )
    );
  }

  private async seedTenants() {
    const monthOffsets = [-11, -9, -7, -5, -3, -1, 0, 0];
    const tenants = [
      {
        name: "Emerald Tea Co.",
        slug: "emerald-tea-co",
        ownerName: "Nguyễn Văn An",
        ownerEmail: "owner.emerald@teaflow.test",
        ownerPhone: "0901234567",
        plan: "premium",
        status: "active",
        location: "Ho Chi Minh City",
        taxId: "0312345678",
        businessLicense: "BL-EMR-2024-001",
        address: "12 Nguyễn Huệ, Quận 1, TP.HCM",
        accountRole: "super_admin",
        softwareVersion: "v2.4.1",
        contractDurationMonths: 24,
        setupFee: 5000000,
        monthlyFee: 3290000,
        discount: 10
      },
      {
        name: "Azure Highlands Tea",
        slug: "azure-highlands-tea",
        ownerName: "Mai Nguyễn",
        ownerEmail: "owner.azure@teaflow.test",
        ownerPhone: "0912345678",
        plan: "enterprise",
        status: "active",
        location: "Đà Lạt",
        taxId: "5801234567",
        businessLicense: "BL-AZR-2023-089",
        address: "88 Trần Phú, Đà Lạt, Lâm Đồng",
        accountRole: "super_admin",
        softwareVersion: "v2.4.1",
        contractDurationMonths: 36,
        setupFee: 12000000,
        monthlyFee: 8990000,
        discount: 15
      },
      {
        name: "Sweet Pearl Group",
        slug: "sweet-pearl-group",
        ownerName: "Trần Gia Bảo",
        ownerEmail: "owner.sweetpearl@teaflow.test",
        ownerPhone: "0923456789",
        plan: "starter",
        status: "pending",
        location: "Hà Nội",
        taxId: "0109876543",
        businessLicense: "BL-SWP-2026-001",
        address: "25 Cầu Giấy, Hà Nội",
        accountRole: "admin",
        softwareVersion: "v2.4.0",
        contractDurationMonths: 12,
        setupFee: 2500000,
        monthlyFee: 1290000,
        discount: 0
      },
      {
        name: "Lotus Leaf Cafe",
        slug: "lotus-leaf-cafe",
        ownerName: "Phạm Khánh Linh",
        ownerEmail: "owner.lotus@teaflow.test",
        ownerPhone: "0934567890",
        plan: "premium",
        status: "inactive",
        location: "Đà Nẵng",
        taxId: "0401987654",
        businessLicense: "BL-LOT-2025-014",
        address: "102 Bạch Đằng, Đà Nẵng",
        accountRole: "super_admin",
        softwareVersion: "v2.3.8",
        contractDurationMonths: 12,
        setupFee: 5000000,
        monthlyFee: 3290000,
        discount: 5
      },
      {
        name: "Golden Oolong House",
        slug: "golden-oolong-house",
        ownerName: "Lê Quốc Huy",
        ownerEmail: "owner.golden@teaflow.test",
        ownerPhone: "0945678901",
        plan: "enterprise",
        status: "suspended",
        location: "Hải Phòng",
        taxId: "0201765432",
        businessLicense: "BL-GOH-2024-033",
        address: "16 Lạch Tray, Hải Phòng",
        accountRole: "super_admin",
        softwareVersion: "v2.4.1",
        contractDurationMonths: 24,
        setupFee: 10000000,
        monthlyFee: 7990000,
        discount: 10
      },
      {
        name: "Mộc Trà Garden",
        slug: "moc-tra-garden",
        ownerName: "Võ Thanh Tâm",
        ownerEmail: "owner.moc@teaflow.test",
        ownerPhone: "0956789012",
        plan: "starter",
        status: "active",
        location: "Cần Thơ",
        taxId: "1801654321",
        businessLicense: "BL-MOC-2025-028",
        address: "41 Hai Bà Trưng, Cần Thơ",
        accountRole: "admin",
        softwareVersion: "v2.4.1",
        contractDurationMonths: 12,
        setupFee: 2500000,
        monthlyFee: 1290000,
        discount: 0
      },
      {
        name: "Cloud Nine Milk Tea",
        slug: "cloud-nine-milk-tea",
        ownerName: "Đỗ Minh Châu",
        ownerEmail: "owner.cloudnine@teaflow.test",
        ownerPhone: "0967890123",
        plan: "premium",
        status: "active",
        location: "Bình Dương",
        taxId: "3702987654",
        businessLicense: "BL-C9-2026-006",
        address: "09 Đại lộ Bình Dương, Thủ Dầu Một",
        accountRole: "super_admin",
        softwareVersion: "v2.4.1",
        contractDurationMonths: 24,
        setupFee: 5000000,
        monthlyFee: 3290000,
        discount: 8
      },
      {
        name: "Red Lantern Tea",
        slug: "red-lantern-tea",
        ownerName: "Bùi Anh Khoa",
        ownerEmail: "owner.redlantern@teaflow.test",
        ownerPhone: "0978901234",
        plan: "legacy",
        status: "inactive",
        location: "Huế",
        taxId: "3301654789",
        businessLicense: "BL-RLT-2022-011",
        address: "77 Lê Lợi, Huế",
        accountRole: "admin",
        softwareVersion: "v2.1.9",
        contractDurationMonths: 12,
        setupFee: 2000000,
        monthlyFee: 990000,
        discount: 0
      }
    ];

    const seeded = await Promise.all(
      tenants.map((tenant, index) => {
        const createdAt = this.dateAtMonthOffset(monthOffsets[index], 5 + index);
        return this.tenantModel
          .findOneAndUpdate(
            { name: tenant.name },
            { $set: tenant, $setOnInsert: { createdAt } },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
          )
          .exec();
      })
    );

    return new Map(seeded.map((tenant) => [tenant.ownerEmail, tenant]));
  }

  private async seedUsers(tenants: Map<string, TenantDocument>) {
    const users = [
      {
        email: "admin@teaflow.io",
        fullName: "System Admin",
        role: "admin",
        isActive: true,
        ssoProviders: ["google", "microsoft"],
        seedPassword: "Admin@123456"
      },
      ...Array.from(tenants.values()).map((tenant) => ({
        email: tenant.ownerEmail,
        fullName: tenant.ownerName,
        role: tenant.accountRole ?? "super_admin",
        tenantId: tenant._id.toString(),
        isActive: tenant.status !== "suspended",
        ssoProviders: tenant.status === "active" ? ["google"] : [],
        seedPassword: TEST_PASSWORD
      })),
      {
        email: "manager@teaflow.test",
        fullName: "QA Manager",
        role: "manager",
        tenantId: this.tenantId(tenants, "owner.emerald@teaflow.test"),
        isActive: true,
        ssoProviders: ["microsoft"],
        seedPassword: TEST_PASSWORD
      },
      {
        email: "inactive@teaflow.test",
        fullName: "Inactive QA User",
        role: "staff",
        tenantId: this.tenantId(tenants, "owner.lotus@teaflow.test"),
        isActive: false,
        ssoProviders: [],
        seedPassword: TEST_PASSWORD
      },
      {
        email: "reset@teaflow.test",
        fullName: "Password Reset Tester",
        role: "staff",
        tenantId: this.tenantId(tenants, "owner.azure@teaflow.test"),
        isActive: true,
        resetCode: "123456",
        resetCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ssoProviders: [],
        seedPassword: TEST_PASSWORD
      },
      ...DEMO_USERS.map((user, index) => ({
        ...user,
        tenantId: this.tenantId(tenants, "owner.emerald@teaflow.test"),
        isActive: true,
        ssoProviders: index % 2 === 0 ? ["google"] : [],
        seedPassword: DEMO_PASSWORD
      }))
    ];

    await Promise.all(
      users.map(({ seedPassword, ...user }) =>
        this.userModel
          .findOneAndUpdate(
            { email: user.email },
            {
              $set: user,
              $setOnInsert: {
                passwordHash: hashPassword(seedPassword),
                passkeys: []
              }
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
          )
          .exec()
      )
    );
  }

  private async seedContracts(tenants: Map<string, TenantDocument>) {
    const contracts = [
      {
        tenantEmail: "owner.emerald@teaflow.test",
        code: "#CNT-2024-081",
        plan: "saas_subscription",
        status: "active",
        startDate: this.dateFromNow(-240),
        endDate: this.dateFromNow(20),
        amount: 48000000,
        durationMonths: 24,
        additionalTerms: "Gia hạn tự động nếu không có thông báo trước 30 ngày."
      },
      {
        tenantEmail: "owner.azure@teaflow.test",
        code: "TF-2023-0892",
        plan: "franchise",
        status: "active",
        startDate: this.dateFromNow(-400),
        endDate: this.dateFromNow(330),
        amount: 144000000,
        durationMonths: 24,
        additionalTerms: "Bao gồm SLA 99.9% và hỗ trợ ưu tiên 24/7."
      },
      {
        tenantEmail: "owner.sweetpearl@teaflow.test",
        code: "TF-2026-0894",
        plan: "saas_subscription",
        status: "pending",
        startDate: this.dateFromNow(15),
        endDate: this.dateFromNow(380),
        amount: 15480000,
        durationMonths: 12,
        additionalTerms: "Có hiệu lực sau khi hoàn tất thanh toán phí thiết lập."
      },
      {
        tenantEmail: "owner.lotus@teaflow.test",
        code: "TF-2025-0895",
        plan: "support",
        status: "completed",
        startDate: this.dateFromNow(-370),
        endDate: this.dateFromNow(-5),
        amount: 18000000,
        durationMonths: 12,
        additionalTerms: "Gói hỗ trợ triển khai đã nghiệm thu."
      },
      {
        tenantEmail: "owner.golden@teaflow.test",
        code: "TF-2024-0896",
        plan: "franchise",
        status: "expired",
        startDate: this.dateFromNow(-760),
        endDate: this.dateFromNow(-30),
        amount: 96000000,
        durationMonths: 24,
        additionalTerms: "Hợp đồng hết hạn và tài khoản đang tạm ngưng."
      },
      {
        tenantEmail: "owner.moc@teaflow.test",
        code: "TF-2026-0897",
        plan: "saas_subscription",
        status: "active",
        startDate: this.dateFromNow(-60),
        endDate: this.dateFromNow(305),
        amount: 15480000,
        durationMonths: 12
      },
      {
        tenantEmail: "owner.cloudnine@teaflow.test",
        code: "TF-2026-0898",
        plan: "support",
        status: "active",
        startDate: this.dateFromNow(-10),
        endDate: this.dateFromNow(10),
        amount: 24000000,
        durationMonths: 1,
        additionalTerms: "Hợp đồng ngắn hạn dùng để kiểm thử cảnh báo sắp hết hạn."
      },
      {
        tenantEmail: "owner.redlantern@teaflow.test",
        code: "TF-2023-0899",
        plan: "saas_subscription",
        status: "expired",
        startDate: this.dateFromNow(-900),
        endDate: this.dateFromNow(-535),
        amount: 11880000,
        durationMonths: 12
      }
    ];

    await Promise.all(
      contracts.map(({ tenantEmail, ...contract }, index) => {
        const tenant = this.getTenant(tenants, tenantEmail);
        return this.contractModel
          .findOneAndUpdate(
            { code: contract.code },
            {
              $set: {
                ...contract,
                tenantId: tenant._id.toString(),
                ownerName: tenant.ownerName
              },
              $setOnInsert: { createdAt: this.dateAtMonthOffset(-Math.min(11, 7 - index), 12) }
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
          )
          .exec();
      })
    );
  }

  private async seedEmployees(tenants: Map<string, TenantDocument>) {
    const employees = [
      ["owner.emerald@teaflow.test", "Trần Minh Anh", "minhanh@emerald.test", "admin", "Operations", "active", -1],
      ["owner.emerald@teaflow.test", "Lê Hoàng Nam", "nam@emerald.test", "manager", "Sales", "active", -3],
      ["owner.emerald@teaflow.test", "Ngô Thu Hà", "ha@emerald.test", "staff", "Finance", "pending", null],
      ["owner.azure@teaflow.test", "Phan Tuấn Kiệt", "kiet@azure.test", "manager", "Operations", "active", -2],
      ["owner.azure@teaflow.test", "Đặng Mỹ Duyên", "duyen@azure.test", "staff", "Customer Support", "active", -5],
      ["owner.azure@teaflow.test", "Nguyễn Quốc Việt", "viet@azure.test", "staff", "IT", "inactive", -90],
      ["owner.sweetpearl@teaflow.test", "Hoàng Bảo Ngọc", "ngoc@sweetpearl.test", "manager", "Operations", "pending", null],
      ["owner.lotus@teaflow.test", "Trịnh Thanh Sơn", "son@lotus.test", "staff", "Sales", "inactive", -45],
      ["owner.golden@teaflow.test", "Vũ Hải Yến", "yen@golden.test", "admin", "Management", "inactive", -30],
      ["owner.moc@teaflow.test", "Lâm Gia Hân", "han@moc.test", "manager", "Operations", "active", 0],
      ["owner.moc@teaflow.test", "Đinh Đức Long", "long@moc.test", "staff", "Warehouse", "active", -4],
      ["owner.cloudnine@teaflow.test", "Mai Nhật Minh", "minh@cloudnine.test", "staff", "Marketing", "active", -1]
    ] as const;

    await Promise.all(
      employees.map(([tenantEmail, fullName, email, role, department, status, lastLoginDays]) => {
        const update =
          lastLoginDays === null
            ? {
                $set: {
                  tenantId: this.tenantId(tenants, tenantEmail),
                  fullName,
                  email,
                  role,
                  department,
                  status
                },
                $unset: { lastLoginAt: 1 }
              }
            : {
                $set: {
                  tenantId: this.tenantId(tenants, tenantEmail),
                  fullName,
                  email,
                  role,
                  department,
                  status,
                  lastLoginAt: new Date(Date.now() + lastLoginDays * 86400000).toISOString()
                }
              };

        return this.employeeModel
          .findOneAndUpdate({ email }, update, {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true
          })
          .exec();
      })
    );
  }

  private async seedLicenses(tenants: Map<string, TenantDocument>) {
    const licenses = [
      ["owner.emerald@teaflow.test", "LIC-EMR-2024-001", "premium", "active", -240, 20, 5, ["pos", "inventory", "analytics", "crm"]],
      ["owner.azure@teaflow.test", "LIC-AZR-2023-089", "enterprise", "active", -400, 330, 30, ["pos", "inventory", "analytics", "franchise", "api", "sso"]],
      ["owner.sweetpearl@teaflow.test", "LIC-SWP-2026-001", "starter", "pending", 15, 380, 1, ["pos"]],
      ["owner.lotus@teaflow.test", "LIC-LOT-2025-014", "premium", "expired", -370, -5, 5, ["pos", "inventory", "analytics"]],
      ["owner.golden@teaflow.test", "LIC-GOH-2024-033", "enterprise", "suspended", -760, -30, 15, ["pos", "inventory", "analytics", "franchise", "api"]],
      ["owner.moc@teaflow.test", "LIC-MOC-2026-028", "starter", "active", -60, 305, 1, ["pos", "inventory"]],
      ["owner.cloudnine@teaflow.test", "LIC-C9-2026-006", "premium", "active", -10, 10, 4, ["pos", "inventory", "analytics", "crm"]],
      ["owner.redlantern@teaflow.test", "LIC-RLT-2023-011", "legacy", "expired", -900, -535, 1, ["pos", "legacy_reports"]]
    ] as const;

    await Promise.all(
      licenses.map(([tenantEmail, licenseKey, plan, status, issuedOffset, expiresOffset, maxStores, features]) =>
        this.licenseModel
          .findOneAndUpdate(
            { licenseKey },
            {
              $set: {
                tenantId: this.tenantId(tenants, tenantEmail),
                licenseKey,
                plan,
                status,
                issuedAt: this.dateFromNow(issuedOffset),
                expiresAt: this.dateFromNow(expiresOffset),
                maxStores,
                features: [...features]
              }
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
          )
          .exec()
      )
    );
  }

  private getTenant(tenants: Map<string, TenantDocument>, email: string) {
    const tenant = tenants.get(email);
    if (!tenant) {
      throw new Error(`Seed tenant not found: ${email}`);
    }
    return tenant;
  }

  private tenantId(tenants: Map<string, TenantDocument>, email: string) {
    return this.getTenant(tenants, email)._id.toString();
  }

  private dateFromNow(days: number) {
    return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  }

  private dateAtMonthOffset(monthOffset: number, day: number) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 9, 0, 0);
  }
}
