export enum TenantStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum SubscriptionPlan {
  SOLO = 'SOLO',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum BusinessModel {
  SMALL = 'SMALL',
  LARGE = 'LARGE',
}

export interface TenantSettings {
  timezone?: string;
  onboardingCompletedAt?: string;
  /** false = chỉ quản lý hóa đơn, không trừ kho */
  trackInventory?: boolean;
  /** POS: hỏi % đường sau topping */
  posSugarChoiceEnabled?: boolean;
  /** POS: hỏi % đá sau topping */
  posIceChoiceEnabled?: boolean;
  /** Mức % đường trên POS — VD [25,50,75,100] */
  sugarLevels?: number[];
  /** Mức % đá trên POS — VD [20,30,60] */
  iceLevels?: number[];
  taxCode?: string;
  invoiceTemplate?: string;
  invoiceSerial?: string;
  vatRate?: number;
  address?: string;
  phone?: string;
}

export interface TenantInfo {
  id: string;
  storeName: string;
  slug: string;
  businessModel: BusinessModel;
  /** Gói mục tiêu sau trial (Solo · Store · Chain) */
  intendedPlan?: SubscriptionPlan;
  packageType: SubscriptionPlan;
  status: TenantStatus;
  trialExpiredAt?: string;
  subscriptionExpiredAt?: string;
  settings?: TenantSettings;
}

export interface SubscriptionInfo {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  maxEmployees: number;
  maxBranches: number;
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt?: string;
}
