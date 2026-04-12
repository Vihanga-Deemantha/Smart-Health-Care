import NotificationPreference from "../models/NotificationPreference.js";
import NotificationLog from "../models/NotificationLog.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";

export const getNotificationPreferences = async (userId) => {
  const preference = await NotificationPreference.findOne({ userId }).lean();

  if (preference) {
    return preference;
  }

  return NotificationPreference.create({ userId });
};

export const updateNotificationPreferences = async (userId, payload) => {
  return NotificationPreference.findOneAndUpdate(
    { userId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const logNotification = async (payload) => {
  return NotificationLog.create(payload);
};

export const publishNotificationEvent = async (routingKey, payload) => {
  await publishEvent(routingKey, payload);
};
