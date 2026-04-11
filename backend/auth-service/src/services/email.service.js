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

const getOtpEmailTemplate = ({ otp, purpose }) => {
  const isVerification = purpose === "EMAIL_VERIFY";
  const previewText = isVerification
    ? "Use this one-time password to verify your Smart Health Care account."
    : "Use this one-time password to reset your Smart Health Care password.";
  const title = isVerification ? "Confirm Your Email Address" : "Reset Your Password";
  const intro = isVerification
    ? "Welcome to Smart Health Care. Use the one-time password below to verify your email address and finish setting up your account."
    : "We received a request to reset your Smart Health Care password. Use the one-time password below to continue securely.";
  const supportCopy = isVerification
    ? "If you did not create this account, you can safely ignore this email."
    : "If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.";

  const text = isVerification
    ? `Your verification OTP is ${otp}. It expires in 5 minutes.`
    : `Your password reset OTP is ${otp}. It expires in 5 minutes.`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#eef4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#16313f;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${previewText}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#eaf4f7 0%,#eef2f8 100%);margin:0;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(28,61,79,0.14);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f5c78 0%,#128b8a 100%);padding:32px 40px 28px;color:#ffffff;">
                    <div style="font-size:12px;letter-spacing:1.8px;text-transform:uppercase;opacity:0.82;font-weight:700;">
                      Smart Health Care
                    </div>
                    <div style="margin-top:14px;font-size:30px;line-height:1.25;font-weight:700;">
                      ${title}
                    </div>
                    <div style="margin-top:12px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.92);">
                      ${intro}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 40px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9e7ec;border-radius:20px;background:linear-gradient(180deg,#f8fcfd 0%,#f2f8fa 100%);">
                      <tr>
                        <td align="center" style="padding:28px 24px;">
                          <div style="font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#537181;">
                            One-Time Password
                          </div>
                          <div style="margin-top:16px;font-size:36px;line-height:1;letter-spacing:10px;font-weight:800;color:#0f5c78;">
                            ${otp}
                          </div>
                          <div style="margin-top:16px;font-size:14px;line-height:1.6;color:#5b7684;">
                            This code expires in <strong>5 minutes</strong> and can be used only once.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px;">
                    <div style="font-size:15px;line-height:1.75;color:#46606d;">
                      Enter this code in the app to continue. For your security, please do not share this OTP with anyone.
                    </div>
                    <div style="margin-top:18px;padding:16px 18px;border-radius:14px;background-color:#f4f8fb;font-size:14px;line-height:1.7;color:#607784;">
                      ${supportCopy}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e2edf1;padding:22px 40px 30px;background-color:#fbfdfe;">
                    <div style="font-size:13px;line-height:1.7;color:#79909c;">
                      This is an automated security email from Smart Health Care. Please do not reply directly to this message.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { text, html };
};

export const sendOtpEmail = async (email, otp, purpose) => {
  const subject =
    purpose === "EMAIL_VERIFY"
      ? "Verify your email"
      : "Reset your password";

  const { text, html } = getOtpEmailTemplate({ otp, purpose });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    text,
    html
  });
};
