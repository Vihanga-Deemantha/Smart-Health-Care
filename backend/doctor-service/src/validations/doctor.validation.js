import { body, param, query } from "express-validator";

export const doctorIdValidation = [
  param("id").isMongoId().withMessage("Invalid doctor id")
];

export const createDoctorValidation = [
  body("userId").isMongoId().withMessage("User id is required"),
  body("licenseNumber").trim().notEmpty().withMessage("License number is required"),
  body("specialties").optional().isArray().withMessage("Specialties must be an array"),
  body("bio").optional().isString().withMessage("Bio must be a string"),
  body("hospitalId").optional().trim().isString().withMessage("hospitalId must be a string"),
  body("contactNumber").optional().trim().isString().withMessage("contactNumber must be a string"),
  body("address").optional().trim().isString().withMessage("address must be a string"),
  body("consultationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("consultationFee must be a positive number"),
  body("yearsOfExperience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("yearsOfExperience must be a positive number"),
  body("profilePhoto").optional().trim().isURL().withMessage("profilePhoto must be a URL"),
  body("isAvailable").optional().isBoolean().withMessage("isAvailable must be boolean"),
  body("qualifications").optional().isArray().withMessage("qualifications must be an array"),
  body("qualifications.*.title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("qualification title is required"),
  body("qualifications.*.institution").optional().trim().isString(),
  body("qualifications.*.year").optional().isInt({ min: 1900, max: 2100 }),
  body("qualifications.*.documentUrl").optional().isURL().withMessage("documentUrl must be a URL"),
  body("qualifications.*.notes").optional().trim().isString()
];

export const updateDoctorProfileValidation = [
  body().custom((value, { req }) => {
    const allowedFields = [
      "hospitalId",
      "contactNumber",
      "address",
      "consultationFee",
      "yearsOfExperience",
      "specialties",
      "bio",
      "licenseNumber",
      "isAvailable",
      "qualifications",
      "profilePhoto"
    ];

    const hasField = allowedFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));

    if (!hasField) {
      throw new Error("At least one profile field must be provided");
    }

    return true;
  }),
  body("hospitalId").optional().trim().isString().withMessage("hospitalId must be a string"),
  body("contactNumber").optional().trim().isString().withMessage("contactNumber must be a string"),
  body("address").optional().trim().isString().withMessage("address must be a string"),
  body("consultationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("consultationFee must be a positive number"),
  body("yearsOfExperience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("yearsOfExperience must be a positive number"),
  body("specialties").optional().isArray().withMessage("specialties must be an array"),
  body("specialties.*").optional().trim().isString().withMessage("specialties must be strings"),
  body("bio").optional().isString().withMessage("bio must be a string"),
  body("licenseNumber").optional().trim().notEmpty().withMessage("licenseNumber cannot be empty"),
  body("isAvailable").optional().isBoolean().withMessage("isAvailable must be boolean"),
  body("profilePhoto").optional().trim().isURL().withMessage("profilePhoto must be a URL"),
  body("qualifications").optional().isArray().withMessage("qualifications must be an array"),
  body("qualifications.*.title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("qualification title is required"),
  body("qualifications.*.institution").optional().trim().isString(),
  body("qualifications.*.year").optional().isInt({ min: 1900, max: 2100 }),
  body("qualifications.*.documentUrl").optional().isURL().withMessage("documentUrl must be a URL"),
  body("qualifications.*.notes").optional().trim().isString()
];

export const availabilityValidation = [
  body("availability")
    .isArray({ min: 1 })
    .withMessage("availability must be a non-empty array"),
  body("availability.*.weekday")
    .isInt({ min: 0, max: 6 })
    .withMessage("weekday must be between 0 and 6"),
  body("availability.*.startHour")
    .isInt({ min: 0, max: 23 })
    .withMessage("startHour must be between 0 and 23"),
  body("availability.*.endHour")
    .isInt({ min: 1, max: 24 })
    .withMessage("endHour must be between 1 and 24"),
  body("availability.*.slotDurationMinutes")
    .isInt({ min: 5, max: 120 })
    .withMessage("slotDurationMinutes must be between 5 and 120"),
  body("availability.*.mode")
    .isIn(["IN_PERSON", "TELEMEDICINE"])
    .withMessage("mode must be IN_PERSON or TELEMEDICINE"),
  body("availability.*.bufferMinutes")
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage("bufferMinutes must be between 0 and 60"),
  body("availability.*.timezone")
    .optional()
    .isString()
    .withMessage("timezone must be a string"),
  body("availability.*.active")
    .optional()
    .isBoolean()
    .withMessage("active must be boolean")
];

export const patientReportValidation = [
  param("patientId").isMongoId().withMessage("Invalid patient id")
];

export const doctorAvailabilityLookupValidation = [
  param("id").isMongoId().withMessage("Invalid doctor id"),
  query("date").isISO8601().withMessage("date must be a valid ISO date"),
  query("mode")
    .optional()
    .isIn(["IN_PERSON", "TELEMEDICINE"])
    .withMessage("mode must be IN_PERSON or TELEMEDICINE")
];
