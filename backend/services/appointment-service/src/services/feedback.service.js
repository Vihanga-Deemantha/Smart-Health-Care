import Feedback from "../models/Feedback.js";
import Appointment from "../models/Appointment.js";
import AppError from "../utils/AppError.js";
import { APPOINTMENT_STATUS } from "../utils/constants.js";
import { createAuditLog } from "./audit.service.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";
import { getDoctorProfile } from "../integrations/doctorService.client.js";

export const submitFeedback = async ({ appointmentId, patientId, rating, review, isAnonymous }) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  if (String(appointment.patientId) !== String(patientId)) {
    throw new AppError("Feedback can only be submitted by appointment patient", 403, "FORBIDDEN");
  }

  if (![APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.COMPLETED].includes(appointment.status)) {
    throw new AppError("Feedback is allowed only for confirmed/completed appointments", 409, "INVALID_FEEDBACK_STATE");
  }

  const existing = await Feedback.findOne({ appointmentId });
  if (existing) {
    throw new AppError("Feedback already exists for this appointment", 409, "DUPLICATE_FEEDBACK");
  }

  const doctorProfile = await getDoctorProfile(appointment.doctorId);
  const resolvedDoctorName = doctorProfile?.fullName || doctorProfile?.name || null;

  const feedback = await Feedback.create({
    appointmentId,
    doctorId: appointment.doctorId,
    doctorName: resolvedDoctorName,
    patientId,
    rating,
    review,
    isAnonymous
  });

  await createAuditLog({
    appointmentId,
    entityType: "FEEDBACK",
    entityId: feedback._id.toString(),
    action: "FEEDBACK_SUBMITTED",
    actorId: patientId,
    actorRole: "PATIENT",
    metadata: { rating }
  });

  await publishEvent("feedback.submitted", {
    feedbackId: feedback._id.toString(),
    appointmentId,
    doctorId: appointment.doctorId,
    patientId,
    rating
  });

  return feedback;
};

export const getDoctorReviews = async ({ doctorId, page = 1, limit = 10 }) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total, aggregates] = await Promise.all([
    Feedback.find({ doctorId, moderationStatus: "VISIBLE" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Feedback.countDocuments({ doctorId, moderationStatus: "VISIBLE" }),
    Feedback.aggregate([
      { $match: { doctorId, moderationStatus: "VISIBLE" } },
      { $group: { _id: "$doctorId", avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ])
  ]);

  return {
    reviews,
    summary: aggregates[0] || { avgRating: 0, totalReviews: 0 },
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const moderateFeedback = async ({ feedbackId, moderationStatus, actorId, actorRole }) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError("Feedback not found", 404, "FEEDBACK_NOT_FOUND");
  }

  feedback.moderationStatus = moderationStatus;
  feedback.moderatedBy = actorId;
  feedback.moderatedAt = new Date();
  await feedback.save();

  await createAuditLog({
    entityType: "FEEDBACK",
    entityId: feedbackId,
    action: "FEEDBACK_MODERATED",
    actorId,
    actorRole,
    oldValue: null,
    newValue: { moderationStatus }
  });

  return feedback;
};
