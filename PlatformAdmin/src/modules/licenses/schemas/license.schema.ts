import { z } from "zod";

export const licenseSchema = z.object({
  tenantId: z.string().min(1),
  licenseKey: z.string().min(3),
  plan: z.string().min(1),
  status: z.enum(["active", "expired", "suspended", "pending"]),
  issuedAt: z.string().min(1),
  expiresAt: z.string().min(1),
  maxStores: z.coerce.number().int().positive(),
  features: z.string().min(1)
});
