import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

export const patientRegisterSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const doctorRegisterSchema = patientRegisterSchema
  .extend({
    medicalLicenseNumber: z.string().min(1, "Medical license number is required"),
    specialization: z.string().min(1, "Specialization is required"),
    yearsOfExperience: z.coerce.number().min(0, "Years of experience must be zero or more"),
    qualificationDocuments: z.string().optional()
  })
  .transform((values) => ({
    ...values,
    qualificationDocuments: values.qualificationDocuments
      ? values.qualificationDocuments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : []
  }));

export const verifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  otpCode: z.string().length(6, "OTP must be 6 digits")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email")
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    otpCode: z.string().length(6, "OTP must be 6 digits"),
    newPassword: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });
