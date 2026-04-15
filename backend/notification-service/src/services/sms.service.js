import twilio from "twilio";
import env from "../config/env.js";
import { formatPhone } from "../utils/phone.utils.js";

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

export const sendSms = async ({ to, message }) => {
  const formatted = formatPhone(to);

  if (!formatted) {
    throw new Error("Invalid SMS recipient phone");
  }

  if (!env.twilioSmsFrom) {
    throw new Error("TWILIO_SMS_FROM not configured");
  }

  const twilioClient = getClient();

  return twilioClient.messages.create({
    from: env.twilioSmsFrom,
    to: formatted,
    body: message
  });
};
