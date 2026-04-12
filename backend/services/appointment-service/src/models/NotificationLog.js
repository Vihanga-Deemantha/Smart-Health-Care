import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null, index: true },
    userId: { type: String, required: true, index: true },
    channel: { type: String, enum: ["SMS", "WHATSAPP", "EMAIL"], required: true },
    eventType: { type: String, required: true, index: true },
    deliveryStatus: {
      type: String,
      enum: ["SENT", "DELIVERED", "FAILED"],
      default: "SENT",
      index: true
    },
    providerMessageId: { type: String, default: null },
    errorMessage: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

notificationLogSchema.index({ notificationId: 1, deliveryStatus: 1 }, { name: "idx_notification_status" });
notificationLogSchema.index({ eventType: 1, deliveryStatus: 1, createdAt: -1 }, { name: "idx_notification_analytics" });

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export default NotificationLog;
