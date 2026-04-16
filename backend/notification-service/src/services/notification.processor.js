import { NOTIFICATION_CONFIG } from "../config/notification.config.js";
import NotificationLog from "../models/NotificationLog.js";
import { getEmailTemplate } from "../templates/email/index.js";
import { getSmsTemplate } from "../templates/sms/index.js";
import { sendEmail } from "./email.service.js";
import { sendSms } from "./sms.service.js";
import { sendWhatsApp } from "./whatsapp.service.js";

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

  if (!config) {
    console.log(`No notification config for ${event}. Skipping.`);
    return;
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
      channelResults.push({ channel, status: "SENT" });
    } catch (err) {
      console.error(`Channel ${channel} failed for ${event}:`, err.message);
      channelResults.push({ channel, status: "FAILED", error: err.message });
    }
  }

  await NotificationLog.create({
    event,
    routingKey: event,
    recipientId: recipient?.id || null,
    channels: channelResults,
    payload
  });
};
