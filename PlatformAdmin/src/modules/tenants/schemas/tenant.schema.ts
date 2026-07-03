import { z } from "zod";

export const tenantSchema = z.object({
  name: z.string().min(2),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  plan: z.string().min(1),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  location: z.string().optional(),
  taxId: z.string().optional(),
  businessLicense: z.string().optional(),
  address: z.string().optional(),
  ownerPhone: z.string().optional(),
  accountRole: z.enum(["super_admin", "manager"]).optional(),
  initialPassword: z.string().min(8).optional(),
  softwareVersion: z.string().optional(),
  contractDurationMonths: z.coerce.number().int().positive().optional(),
  setupFee: z.coerce.number().min(0).optional(),
  monthlyFee: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional()
});

export const createTenantSchema = tenantSchema.extend({
  initialPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự")
});

export const updateTenantSchema = tenantSchema.omit({ initialPassword: true }).partial().extend({
  name: z.string().min(2),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  plan: z.string().min(1),
  status: z.enum(["active", "inactive", "pending", "suspended"])
});
