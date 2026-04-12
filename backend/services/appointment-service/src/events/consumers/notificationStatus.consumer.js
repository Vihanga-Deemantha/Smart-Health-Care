import NotificationLog from "../../models/NotificationLog.js";

export const handleNotificationDeliveryUpdate = async (message) => {
  const payload = typeof message === "string" ? JSON.parse(message) : message;

  await NotificationLog.findOneAndUpdate(
    { notificationId: payload.notificationId },
    {
      $set: {
        deliveryStatus: payload.deliveryStatus,
        providerMessageId: payload.providerMessageId || null,
        errorMessage: payload.errorMessage || null
      }
    },
    { new: true }
  );
};
