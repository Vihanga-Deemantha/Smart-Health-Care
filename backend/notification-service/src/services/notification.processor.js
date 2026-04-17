import { NOTIFICATION_CONFIG } from "../config/notification.config.js";
import NotificationLog from "../models/NotificationLog.js";
import { getEmailTemplate } from "../templates/email/index.js";
import { getSmsTemplate } from "../templates/sms/index.js";
import { sendEmail } from "./email.service.js";
import { sendSms } from "./sms.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";

const isRetryableChannelError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  if (!message) {
    return true;
  }

  const nonRetryableFragments = [
    "recipient email missing",
    "recipient phone missing",
    "email template missing",
    "sms template missing",
    "whatsapp template missing",
    "unknown channel"
  ];

  return !nonRetryableFragments.some((fragment) => message.includes(fragment));
};

const resolveRecipient = (recipientType, payload) => {
  if (!recipientType || !payload) {
    return null;
  }

  const recipient = payload[recipientType];
  if (!recipient) {
    return null;
  }

  return {
    id: recipient.userId || recipient.id || null,
    name: recipient.fullName || recipient.name || "there",
    email: recipient.email || null,
    phone: recipient.phone || null
  };
};

const attemptEmail = async (event, config, recipient, payload) => {
  if (!recipient?.email) {
    throw new Error("Recipient email missing");
  }

  const html = getEmailTemplate(event, payload);
  if (!html) {
    throw new Error("Email template missing");
  }

  await sendEmail({
    to: recipient.email,
    subject: config.email?.subject || "Smart Health notification",
    html
  });
};

const attemptSms = async (event, recipient, payload) => {
  if (!recipient?.phone) {
    throw new Error("Recipient phone missing");
  }

  const message = getSmsTemplate(event, payload);
  if (!message) {
    throw new Error("SMS template missing");
  }

  await sendSms({ to: recipient.phone, message });
};

const attemptWhatsApp = async (event, recipient, payload) => {
  if (!recipient?.phone) {
    throw new Error("Recipient phone missing");
  }

  const message = getSmsTemplate(event, payload);
  if (!message) {
    throw new Error("WhatsApp template missing");
  }

  await sendWhatsApp({ to: recipient.phone, message });
};

export const processNotification = async (event, payload) => {
  const config = NOTIFICATION_CONFIG[event];
  const eventId = payload?.eventId || null;

  if (!config) {
    console.log(`No notification config for ${event}. Skipping.`);
    return { skipped: true };
  }

  if (eventId) {
    const alreadySent = await NotificationLog.exists({ eventId, deliveryStatus: "SENT" });
    if (alreadySent) {
      console.log(`Duplicate notification ignored for eventId=${eventId}`);
      return { skipped: true, duplicate: true };
    }
  }

  const recipient = resolveRecipient(config.recipient, payload);
  const channels = config.channels || [];
  const channelResults = [];

  console.log(`Channels to notify for ${event}: ${channels.join(", ")}`);

  for (const channel of channels) {
    try {
      if (channel === "email") {
        await attemptEmail(event, config, recipient, payload);
      } else if (channel === "sms") {
        await attemptSms(event, recipient, payload);
      } else if (channel === "whatsapp") {
        await attemptWhatsApp(event, recipient, payload);
      } else {
        throw new Error(`Unknown channel: ${channel}`);
      }

      console.log(`Channel ${channel} succeeded for ${event}`);
      channelResults.push({ channel, status: "SENT", error: null, retryable: false });
    } catch (err) {
      console.error(`Channel ${channel} failed for ${event}:`, err.message);
      channelResults.push({
        channel,
        status: "FAILED",
        error: err.message,
        retryable: isRetryableChannelError(err)
      });
    }
  }

  const anySent = channelResults.some((entry) => entry.status === "SENT");
  const shouldRetry = channelResults.some((entry) => entry.retryable);

  await NotificationLog.create({
    eventId,
    event,
    routingKey: event,
    recipientId: recipient?.id || null,
    deliveryStatus: anySent ? "SENT" : "FAILED",
    channels: channelResults.map(({ channel, status, error }) => ({ channel, status, error })),
    payload
  });

  if (!anySent) {
    const failure = new Error(`All notification channels failed for ${event}`);
    failure.retryable = shouldRetry;
    throw failure;
  }

  return { success: true };
};
