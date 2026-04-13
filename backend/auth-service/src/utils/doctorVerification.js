export const normalizeVerificationLinks = (verificationLinks) => {
  if (!verificationLinks) {
    return [];
  }

  if (Array.isArray(verificationLinks)) {
    return verificationLinks
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof verificationLinks === "string") {
    const trimmed = verificationLinks.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeVerificationLinks(parsed);
    } catch {
      return [trimmed];
    }
  }

  return [];
};

export const mapVerificationDocumentsToLegacyList = (
  verificationDocuments = [],
  verificationLinks = []
) => {
  return [
    ...verificationDocuments
      .map((item) => item?.filename?.trim())
      .filter(Boolean),
    ...verificationLinks
  ];
};

export const extractVerificationDocumentPublicIds = (verificationDocuments = []) => {
  return verificationDocuments
    .map((item) => item?.publicId?.trim?.() || "")
    .filter(Boolean);
};
