import twilio from "twilio";
import env from "../config/env.js";
import { formatWhatsApp } from "../utils/phone.utils.js";

let client = null;

const getClient = () => {
  if (client) {
    return client;
  }

  if (!env.twilioAccountSid || !env.twilioAuthToken) {
    throw new Error("Twilio credentials not configured");
  }

  client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  return client;
};

export const sendWhatsApp = async ({ to, message }) => {
  const formatted = formatWhatsApp(to);

  if (!formatted) {
    throw new Error("Invalid WhatsApp recipient phone");
  }

  if (!env.twilioWhatsappFrom) {
    throw new Error("TWILIO_WHATSAPP_FROM not configured");
  }

  const twilioClient = getClient();

  return twilioClient.messages.create({
    from: env.twilioWhatsappFrom,
    to: formatted,
    body: message
  });
};
