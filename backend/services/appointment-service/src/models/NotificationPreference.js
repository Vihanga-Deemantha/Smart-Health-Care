import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    smsEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    timezone: { type: String, default: "UTC" },
    locale: { type: String, default: "en" }
  },
  { timestamps: true }
);

notificationPreferenceSchema.index({ userId: 1 }, { name: "idx_notification_pref_user" });

const NotificationPreference = mongoose.model("NotificationPreference", notificationPreferenceSchema);

export default NotificationPreference;
