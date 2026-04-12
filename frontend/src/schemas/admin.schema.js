import { z } from "zod";

export const rejectDoctorSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters")
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().optional()
}).superRefine((values, context) => {
  if (values.status === "SUSPENDED" && !values.reason?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reason"],
      message: "Suspension reason is required"
    });
  }
});
