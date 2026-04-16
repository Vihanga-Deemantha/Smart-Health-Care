import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number.parseInt(process.env.PORT || "5032", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:8080",
  serviceName: process.env.SERVICE_NAME || "notification-service",
  mongodbUri: process.env.MONGODB_URI || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET || "",
  rabbitmqUrl: process.env.RABBITMQ_URL || "",
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || "smart_health.events",
  rabbitmqQueue: process.env.RABBITMQ_QUEUE || "notification.universal.queue",
  rabbitmqBindingKey: process.env.RABBITMQ_BINDING_KEY || "notification.#",
  rabbitmqRetryMs: Number.parseInt(process.env.RABBITMQ_RETRY_MS || "5000", 10),
  rabbitmqMaxDeliveryAttempts: Number.parseInt(
    process.env.RABBITMQ_MAX_DELIVERY_ATTEMPTS || "3",
    10
  ),
  rabbitmqDlqQueue: process.env.RABBITMQ_DLQ_QUEUE || "notification.deadletter.queue",
  rabbitmqDlqRoutingKey: process.env.RABBITMQ_DLQ_ROUTING_KEY || "deadletter.notification",
  emailHost: process.env.EMAIL_HOST || "smtp.gmail.com",
  emailPort: Number.parseInt(process.env.EMAIL_PORT || "587", 10),
  emailUser: process.env.EMAIL_USER || "",
  emailPass: process.env.EMAIL_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "Smart Health <no-reply@smarthealth.local>",
  notifyLkApiUrl: process.env.NOTIFY_LK_API_URL || "https://app.notify.lk/api/v1/send",
  notifyLkUserId: process.env.NOTIFY_LK_USER_ID || "",
  notifyLkApiKey: process.env.NOTIFY_LK_API_KEY || "",
  notifyLkSenderId: process.env.NOTIFY_LK_SENDER_ID || "NotifyDEMO",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || ""
};

export default env;
