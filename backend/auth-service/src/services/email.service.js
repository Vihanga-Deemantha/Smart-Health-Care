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

const buildEmailTemplate = ({
  previewText,
  title,
  intro,
  sectionLabel,
  sectionTitle,
  sectionBody,
  footerNote
}) => {
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
                      Healio smart health care
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
                            ${sectionLabel}
                          </div>
                          <div style="margin-top:16px;font-size:28px;line-height:1.25;font-weight:800;color:#0f5c78;">
                            ${sectionTitle}
                          </div>
                          <div style="margin-top:16px;font-size:14px;line-height:1.8;color:#5b7684;">
                            ${sectionBody}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px;">
                    <div style="padding:16px 18px;border-radius:14px;background-color:#f4f8fb;font-size:14px;line-height:1.7;color:#607784;">
                      ${footerNote}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e2edf1;padding:22px 40px 30px;background-color:#fbfdfe;">
                    <div style="font-size:13px;line-height:1.7;color:#79909c;">
                      This is an automated service email from Healio smart health care. Please do not reply directly to this message.
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

  return {
    html,
    text: `${title}\n\n${intro}\n\n${sectionTitle}\n${sectionBody.replace(/<[^>]*>/g, "")}\n\n${footerNote.replace(/<[^>]*>/g, "")}`
  };
};

const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
};

const getOtpEmailTemplate = ({ otp, purpose }) => {
  const isVerification = purpose === "EMAIL_VERIFY";

  return buildEmailTemplate({
    previewText: isVerification
      ? "Use this one-time password to verify your Healio smart health care account."
      : "Use this one-time password to reset your Healio smart health care password.",
    title: isVerification ? "Confirm Your Email Address" : "Reset Your Password",
    intro: isVerification
      ? "Welcome to Healio smart health care. Use the one-time password below to verify your email address and finish setting up your account."
      : "We received a request to reset your Healio smart health care password. Use the one-time password below to continue securely.",
    sectionLabel: "One-Time Password",
    sectionTitle: otp,
    sectionBody:
      "This code expires in <strong>5 minutes</strong> and can be used only once. Enter it in the app to continue securely.",
    footerNote: isVerification
      ? "If you did not create this account, you can safely ignore this email."
      : "If you did not request a password reset, you can safely ignore this email and your password will remain unchanged."
  });
};

export const sendOtpEmail = async (email, otp, purpose) => {
  const subject =
    purpose === "EMAIL_VERIFY"
      ? "Verify your email"
      : "Reset your password";

  const { text, html } = getOtpEmailTemplate({ otp, purpose });

  await sendEmail({
    to: email,
    subject,
    text,
    html
  });
};

export const sendPatientWelcomeEmail = async ({ email, fullName }) => {
  const { text, html } = buildEmailTemplate({
    previewText: "Your Healio patient account is now active.",
    title: "Welcome to Healio",
    intro: `Hi ${fullName || "there"}, your patient account is now verified and ready to use.`,
    sectionLabel: "Account Ready",
    sectionTitle: "Welcome aboard",
    sectionBody:
      "You can now sign in to Healio, manage your health journey, and continue using the platform with a verified patient account.",
    footerNote:
      "If you notice any issue with your account setup, please contact the platform support team."
  });

  await sendEmail({
    to: email,
    subject: "Welcome to Healio",
    text,
    html
  });
};

export const sendDoctorApprovedEmail = async ({ email, fullName }) => {
  const { text, html } = buildEmailTemplate({
    previewText: "Your doctor account has been approved.",
    title: "Doctor Account Approved",
    intro: `Hi ${fullName || "there"}, your verification review has been completed successfully.`,
    sectionLabel: "Review Outcome",
    sectionTitle: "Approval confirmed",
    sectionBody:
      "Your doctor account is now approved. You can sign in to Healio and begin accessing the doctor features available on the platform.",
    footerNote:
      "Thank you for completing the verification process. We are glad to have you on the platform."
  });

  await sendEmail({
    to: email,
    subject: "Your doctor account has been approved",
    text,
    html
  });
};

export const sendDoctorRejectedEmail = async ({ email, fullName, reason }) => {
  const reviewReason = reason?.trim() || "Your submitted documents could not be validated.";
  const { text, html } = buildEmailTemplate({
    previewText: "Your doctor verification submission needs attention.",
    title: "Doctor Verification Update",
    intro: `Hi ${fullName || "there"}, we reviewed your doctor registration submission.`,
    sectionLabel: "Review Outcome",
    sectionTitle: "Additional action needed",
    sectionBody: `We could not approve the submission at this stage.<br /><br /><strong>Review note:</strong> ${reviewReason}<br /><br />Please prepare updated or valid supporting documents before trying again.`,
    footerNote:
      "If you believe this was a mistake, contact the administrative team and include the documents you submitted."
  });

  await sendEmail({
    to: email,
    subject: "Your doctor verification was not approved",
    text,
    html
  });
};

export const sendAccountStatusEmail = async ({
  email,
  fullName,
  status,
  reason
}) => {
  const isSuspended = status === "SUSPENDED";
  const normalizedReason = reason?.trim();
  const { text, html } = buildEmailTemplate({
    previewText: isSuspended
      ? "Your Healio account has been suspended."
      : "Your Healio account has been reactivated.",
    title: isSuspended ? "Account Suspended" : "Account Reactivated",
    intro: `Hi ${fullName || "there"}, there has been an update to your Healio account status.`,
    sectionLabel: "Status Update",
    sectionTitle: isSuspended ? "Access temporarily restricted" : "Access restored",
    sectionBody: isSuspended
      ? `Your account has been suspended by an administrator. You will not be able to use the platform until the restriction is lifted.${normalizedReason ? `<br /><br /><strong>Administrative note:</strong> ${normalizedReason}` : ""}`
      : "Your account has been reactivated. You can now sign in and continue using the platform.",
    footerNote: isSuspended
      ? "If you need help understanding this action, please contact the administrative team."
      : "If you still cannot sign in after this message, please contact support."
  });

  await sendEmail({
    to: email,
    subject: isSuspended
      ? "Your Healio account has been suspended"
      : "Your Healio account has been reactivated",
    text,
    html
  });
};

export const sendEmailSafely = async (task, contextLabel) => {
  try {
    await task();
  } catch (error) {
    console.error(`Email delivery failed for ${contextLabel}:`, error.message);
  }
};
