import { z } from "zod";

export const rejectDoctorSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters")
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"])
});
