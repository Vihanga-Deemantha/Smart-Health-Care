const toDigits = (value) => String(value || "").replace(/\D/g, "");

export const normalizeSriLankanPhone = (value) => {
  const digits = toDigits(value);

  if (!digits) {
    return null;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("94")) {
    return `0${digits.slice(2)}`;
  }

  return null;
};
