import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    channel: { type: String, required: true },
    status: { type: String, enum: ["SENT", "FAILED"], required: true },
    error: { type: String, default: null }
  },
  { _id: false }
);

const notificationLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    routingKey: { type: String, default: null },
    recipientId: { type: String, default: null, index: true },
    channels: { type: [channelSchema], default: [] },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("NotificationLog", notificationLogSchema);
