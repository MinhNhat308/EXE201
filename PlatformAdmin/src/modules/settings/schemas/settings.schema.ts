import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email()
});

export const updateSecuritySchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});
