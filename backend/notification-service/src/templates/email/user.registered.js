const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const row = (label, value) => `
  <tr>
    <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;width:40%;">${label}</td>
    <td style="padding:8px;border:1px solid #e5e7eb;">${value || "-"}</td>
  </tr>
`;

const renderLayout = (greetingName, bodyText, tableRows) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Smart Health</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f8fb;font-family:Arial, sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
        <div style="font-size:22px;font-weight:700;color:#01696f;margin-bottom:16px;">Smart Health</div>
        <div style="font-size:16px;color:#111827;margin-bottom:12px;">Hello ${greetingName},</div>
        <div style="font-size:14px;color:#374151;margin-bottom:16px;">${bodyText}</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${tableRows}
        </table>
        <div style="font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px;">
          Smart Health Platform | Do not reply to this email
        </div>
      </div>
    </div>
  </body>
</html>`;

export default (payload) => {
  const patient = payload?.patient || {};
  const rows = [
    row("User ID", patient.userId),
    row("Email", patient.email),
    row("Registered At", formatDateTime(payload?.registeredAt || payload?.createdAt))
  ].join("");

  return renderLayout(
    patient.fullName || "there",
    "Thanks for joining Smart Health. Your account is ready.",
    rows
  );
};
