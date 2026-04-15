import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!env.emailUser || !env.emailPass) {
    throw new Error("Email credentials not configured");
  }

  transporter = nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailPort === 465,
    auth: {
      user: env.emailUser,
      pass: env.emailPass
    }
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    throw new Error("Missing email recipient");
  }

  const mailer = getTransporter();

  return mailer.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html
  });
};
