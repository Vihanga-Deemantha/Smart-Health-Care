const FALLBACK = "-";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatDateTime = (value) => {
  if (!value) {
    return FALLBACK;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const toneStyles = {
  success: {
    accent: "#0f766e",
    soft: "#ccfbf1",
    badgeBg: "#ccfbf1",
    badgeText: "#115e59"
  },
  warning: {
    accent: "#b45309",
    soft: "#fef3c7",
    badgeBg: "#fef3c7",
    badgeText: "#92400e"
  },
  danger: {
    accent: "#b91c1c",
    soft: "#fee2e2",
    badgeBg: "#fee2e2",
    badgeText: "#991b1b"
  },
  info: {
    accent: "#1d4ed8",
    soft: "#dbeafe",
    badgeBg: "#dbeafe",
    badgeText: "#1d4ed8"
  }
};

const item = (label, value) => `
  <div style="padding:14px 16px;border:1px solid #e5e7eb;border-radius:14px;background:#ffffff;">
    <div style="font-size:12px;line-height:18px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</div>
    <div style="margin-top:6px;font-size:15px;line-height:22px;color:#111827;font-weight:600;">${escapeHtml(value || FALLBACK)}</div>
  </div>
`;

export const renderNotificationEmail = ({
  preheader,
  eyebrow = "Smart Health",
  title,
  greetingName,
  message,
  badge,
  tone = "info",
  highlights = [],
  footerNote = "This is an automated notification from Smart Health."
}) => {
  const palette = toneStyles[tone] || toneStyles.info;
  const cards = highlights
    .filter(({ label, value }) => label)
    .map(({ label, value }) => item(label, value))
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Smart Health</title>
  </head>
  <body style="margin:0;padding:0;background:linear-gradient(180deg,#f0fdfa 0%,#f8fafc 100%);font-family:'Segoe UI',Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || message || title)}</div>
    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="background:#ffffff;border:1px solid #dbe4ea;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        <div style="padding:28px 28px 24px;background:radial-gradient(circle at top right, ${palette.soft} 0%, #ffffff 58%);border-bottom:1px solid #e5e7eb;">
          <div style="font-size:12px;line-height:18px;letter-spacing:0.12em;text-transform:uppercase;color:${palette.accent};font-weight:700;">${escapeHtml(eyebrow)}</div>
          <div style="margin-top:14px;font-size:28px;line-height:34px;font-weight:800;color:#0f172a;">${escapeHtml(title)}</div>
          <div style="margin-top:12px;font-size:16px;line-height:24px;color:#334155;">Hello ${escapeHtml(greetingName || "there")},</div>
          <div style="margin-top:10px;font-size:15px;line-height:24px;color:#475569;">${escapeHtml(message)}</div>
          ${
            badge
              ? `<div style="margin-top:18px;display:inline-block;padding:8px 14px;border-radius:999px;background:${palette.badgeBg};color:${palette.badgeText};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(badge)}</div>`
              : ""
          }
        </div>
        <div style="padding:26px 28px 28px;">
          <div style="font-size:13px;line-height:20px;color:#64748b;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Account Details</div>
          <div style="margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            ${cards}
          </div>
          <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;line-height:18px;color:#64748b;">
            ${escapeHtml(footerNote)}
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};
