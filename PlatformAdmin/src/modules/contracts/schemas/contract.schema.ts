import { z } from "zod";

export const contractSchema = z.object({
  tenantId: z.string().min(1),
  plan: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  amount: z.coerce.number().positive(),
  status: z.enum(["active", "pending", "expired", "completed"]).optional(),
  durationMonths: z.coerce.number().int().positive().optional(),
  additionalTerms: z.string().optional()
});
