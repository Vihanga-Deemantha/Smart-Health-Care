import { body } from "express-validator";

const nicPattern = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

const baseRegisterValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character")
];

const identityValidation = [
  body("identityType")
    .optional({ values: "falsy" })
    .trim()
    .isIn(["NIC", "PASSPORT"])
    .withMessage("Identity type must be NIC or PASSPORT"),
  body("nic")
    .optional({ values: "falsy" })
    .trim()
    .matches(nicPattern)
    .withMessage("Enter a valid NIC number"),
  body("passportNumber")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage("Passport number must be between 6 and 20 characters")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("Passport number can contain only letters and numbers"),
  body("nationality")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Nationality must be between 2 and 60 characters"),
  body().custom((_, { req }) => {
    const identityType = req.body.identityType?.trim();
    const nic = req.body.nic?.trim();
    const passportNumber = req.body.passportNumber?.trim();
    const nationality = req.body.nationality?.trim();

    const hasNic = Boolean(nic);
    const hasPassport = Boolean(passportNumber);
    const hasNationality = Boolean(nationality);

    if (!identityType && (hasNic || hasPassport || hasNationality)) {
      throw new Error(
        "Identity type is required when providing NIC or passport details"
      );
    }

    if (identityType === "NIC") {
      if (!hasNic) {
        throw new Error("NIC number is required when identity type is NIC");
      }

      if (hasPassport || hasNationality) {
        throw new Error(
          "Passport number and nationality are not allowed when identity type is NIC"
        );
      }
    }

    if (identityType === "PASSPORT") {
      if (!hasPassport) {
        throw new Error(
          "Passport number is required when identity type is PASSPORT"
        );
      }

      if (!hasNationality) {
        throw new Error(
          "Nationality is required when identity type is PASSPORT"
        );
      }

      if (hasNic) {
        throw new Error("NIC number is not allowed when identity type is PASSPORT");
      }
    }

    return true;
  })
];

const normalizeLinksPayload = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [trimmed];
    } catch {
      return [trimmed];
    }
  }

  return [];
};

export const registerPatientValidation = [
  ...baseRegisterValidation,
  ...identityValidation
];

export const registerDoctorValidation = [
  ...baseRegisterValidation,
  body("medicalLicenseNumber")
    .trim()
    .notEmpty()
    .withMessage("Medical license number is required"),
  body("specialization").trim().notEmpty().withMessage("Specialization is required"),
  body("yearsOfExperience")
    .optional()
    .isNumeric()
    .withMessage("Years of experience must be a number"),
  body("verificationLinks")
    .optional({ values: "falsy" })
    .customSanitizer((value) => normalizeLinksPayload(value))
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Verification links must be an array");
      }

      if (value.length > 5) {
        throw new Error("You can add up to 5 verification links");
      }

      for (const item of value) {
        if (typeof item !== "string") {
          throw new Error("Each verification link must be a string");
        }

        const trimmed = item.trim();
        const isHttpUrl = /^https?:\/\/.+/i.test(trimmed);

        if (!trimmed || !isHttpUrl) {
          throw new Error("Verification links must be valid http or https URLs");
        }
      }

      return true;
    }),
  body().custom((_, { req }) => {
    const files = Array.isArray(req.files) ? req.files : [];
    const verificationLinks = normalizeLinksPayload(req.body.verificationLinks);

    if (!files.length && !verificationLinks.length) {
      throw new Error(
        "Upload at least one verification document or provide at least one verification link"
      );
    }

    return true;
  })
];

export const resubmitDoctorVerificationValidation = [
  body("verificationLinks")
    .optional({ values: "falsy" })
    .customSanitizer((value) => normalizeLinksPayload(value))
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Verification links must be an array");
      }

      if (value.length > 5) {
        throw new Error("You can add up to 5 verification links");
      }

      for (const item of value) {
        if (typeof item !== "string") {
          throw new Error("Each verification link must be a string");
        }

        const trimmed = item.trim();
        const isHttpUrl = /^https?:\/\/.+/i.test(trimmed);

        if (!trimmed || !isHttpUrl) {
          throw new Error("Verification links must be valid http or https URLs");
        }
      }

      return true;
    }),
  body().custom((_, { req }) => {
    const files = Array.isArray(req.files) ? req.files : [];
    const verificationLinks = normalizeLinksPayload(req.body.verificationLinks);

    if (!files.length && !verificationLinks.length) {
      throw new Error(
        "Upload at least one verification document or provide at least one verification link"
      );
    }

    return true;
  })
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required")
];

export const verifyEmailOtpValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("otpCode")
    .trim()
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
];

export const resendOtpValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail()
];

export const forgotPasswordValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail()
];

export const resetPasswordValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("otpCode")
    .trim()
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
  body("newPassword")
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
];
