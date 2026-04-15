const toDigits = (value) => String(value || "").replace(/\D/g, "");

export const formatPhone = (value) => {
  const digits = toDigits(value);

  if (!digits) {
    return null;
  }

  let normalized = digits;

  if (digits.startsWith("0")) {
    normalized = `94${digits.slice(1)}`;
  } else if (digits.startsWith("94")) {
    normalized = digits;
  }

  return `+${normalized}`;
};

export const formatWhatsApp = (value) => {
  const formatted = formatPhone(value);
  return formatted ? `whatsapp:${formatted}` : null;
};

export const formatNotifyLK = (value) => {
  const digits = toDigits(value);

  if (!digits) {
    return null;
  }

  if (digits.startsWith("0")) {
    return `94${digits.slice(1)}`;
  }

  if (digits.startsWith("94")) {
    return digits;
  }

  return null;
};
