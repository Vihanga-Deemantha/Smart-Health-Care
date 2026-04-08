import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOtpEmail = async (email, otp, purpose) => {
  const subject =
    purpose === "EMAIL_VERIFY"
      ? "Verify your email"
      : "Reset your password";

  const text =
    purpose === "EMAIL_VERIFY"
      ? `Your verification OTP is ${otp}. It expires in 5 minutes.`
      : `Your password reset OTP is ${otp}. It expires in 5 minutes.`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    text
  });
};