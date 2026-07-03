export type LicenseStatus = "active" | "expired" | "suspended" | "pending";

export type LicenseDto = {
  id: string;
  tenantId: string;
  licenseKey: string;
  plan: string;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  maxStores: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateLicenseDto = {
  tenantId: string;
  licenseKey: string;
  plan: string;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  maxStores: number;
  features: string[];
};

export type UpdateLicenseDto = Partial<CreateLicenseDto> & {
  status?: LicenseStatus;
};
