export type TenantStatus = "active" | "inactive" | "pending" | "suspended";

export type TenantDto = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  status: TenantStatus;
  location?: string;
  taxId?: string;
  businessLicense?: string;
  address?: string;
  ownerPhone?: string;
  accountRole?: string;
  softwareVersion?: string;
  contractDurationMonths?: number;
  setupFee?: number;
  monthlyFee?: number;
  discount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantDto = {
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  status: TenantStatus;
  location?: string;
  taxId?: string;
  businessLicense?: string;
  address?: string;
  ownerPhone?: string;
  accountRole?: string;
  initialPassword?: string;
  softwareVersion?: string;
  contractDurationMonths?: number;
  setupFee?: number;
  monthlyFee?: number;
  discount?: number;
};

export type UpdateTenantDto = Partial<Omit<CreateTenantDto, "initialPassword">> & {
  status?: TenantStatus;
};
