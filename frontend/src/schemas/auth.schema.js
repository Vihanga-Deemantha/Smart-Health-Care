import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const nicPattern = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

const optionalTrimmedString = (schema) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, schema.optional());

const optionalIdentityType = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.enum(["NIC", "PASSPORT"]).optional());

const baseRegisterSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  password: passwordSchema,
  confirmPassword: z.string()
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
});

export const patientRegisterSchema = baseRegisterSchema
  .extend({
    identityType: optionalIdentityType,
    nic: optionalTrimmedString(
      z.string().regex(nicPattern, "Enter a valid NIC number")
    ),
    passportNumber: optionalTrimmedString(
      z
        .string()
        .min(6, "Passport number must be at least 6 characters")
        .max(20, "Passport number must be at most 20 characters")
        .regex(/^[A-Za-z0-9]+$/, "Passport number can contain only letters and numbers")
    ),
    nationality: optionalTrimmedString(
      z
        .string()
        .min(2, "Nationality must be at least 2 characters")
        .max(60, "Nationality must be at most 60 characters")
    )
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match"
      });
    }

    if (values.identityType === "NIC") {
      if (!values.nic) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nic"],
          message: "NIC number is required"
        });
      }

      if (values.passportNumber) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["passportNumber"],
          message: "Remove passport details when NIC is selected"
        });
      }

      if (values.nationality) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationality"],
          message: "Nationality is only needed for passport registration"
        });
      }
    }

    if (values.identityType === "PASSPORT") {
      if (!values.passportNumber) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["passportNumber"],
          message: "Passport number is required"
        });
      }

      if (!values.nationality) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationality"],
          message: "Nationality is required"
        });
      }

      if (values.nic) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nic"],
          message: "Remove the NIC number when passport is selected"
        });
      }
    }

    if (!values.identityType && (values.nic || values.passportNumber || values.nationality)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identityType"],
        message: "Choose NIC or passport when adding identity details"
      });
    }
  })
  .transform((values) => ({
    ...values,
    nic: values.nic?.toUpperCase(),
    passportNumber: values.passportNumber?.toUpperCase()
  }));

export const doctorRegisterSchema = baseRegisterSchema
  .extend({
    medicalLicenseNumber: z.string().min(1, "Medical license number is required"),
    specialization: z.string().min(1, "Specialization is required"),
    yearsOfExperience: z.coerce.number().min(0, "Years of experience must be zero or more"),
    verificationLinksInput: optionalTrimmedString(
      z.string().max(1000, "Verification links are too long")
    )
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match"
      });
    }

    if (values.verificationLinksInput) {
      const links = values.verificationLinksInput
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

      for (const link of links) {
        const isHttpUrl = /^https?:\/\/.+/i.test(link);

        if (!isHttpUrl) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["verificationLinksInput"],
            message: "Each verification link must start with http:// or https://"
          });
          break;
        }
      }
    }
  })
  .transform((values) => ({
    ...values,
    verificationLinks: values.verificationLinksInput
      ? values.verificationLinksInput
          .split(/\n|,/)
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
