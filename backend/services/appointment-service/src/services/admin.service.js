import Appointment from "../models/Appointment.js";
import Feedback from "../models/Feedback.js";
import NotificationLog from "../models/NotificationLog.js";

export const getAdminAnalytics = async ({ from, to }) => {
  const dateMatch = {};

  if (from || to) {
    dateMatch.startTime = {};
    if (from) dateMatch.startTime.$gte = new Date(from);
    if (to) dateMatch.startTime.$lte = new Date(to);
  }

  const [totalAppointments, modeRatios, noShowRates, doctorWorkloads, peakBookingTimes, notificationDelivery] = await Promise.all([
    Appointment.countDocuments(dateMatch),
    Appointment.aggregate([
      { $match: dateMatch },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Appointment.aggregate([
      { $match: dateMatch },
      { $group: { _id: "$doctorId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ]),
    Appointment.aggregate([
      { $match: dateMatch },
      {
        $project: {
          hour: { $hour: "$startTime" }
        }
      },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    NotificationLog.aggregate([
      {
        $group: {
          _id: "$deliveryStatus",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    totalAppointments,
    modeRatios,
    noShowRates,
    doctorWorkloads,
    peakBookingTimes,
    notificationDelivery,
    feedbackPendingModeration: await Feedback.countDocuments({ moderationStatus: "FLAGGED" })
  };
};
