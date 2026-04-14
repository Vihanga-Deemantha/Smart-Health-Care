const formatBucketLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });

export const buildRecentDayBuckets = (days = 14, now = new Date()) => {
  const bucketCount = Math.max(1, Number(days) || 1);
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (bucketCount - 1 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: formatBucketLabel(date)
    };
  });
};

export const buildAdminActionTrend = (actions = [], days = 14, now = new Date()) => {
  const buckets = buildRecentDayBuckets(days, now);
  const bucketMap = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        date: bucket.key,
        label: bucket.label,
        approvals: 0,
        changesRequested: 0,
        suspensions: 0,
        reactivations: 0
      }
    ])
  );

  for (const action of actions) {
    const createdAt = action?.createdAt ? new Date(action.createdAt) : null;

    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      continue;
    }

    const bucketKey = createdAt.toISOString().slice(0, 10);
    const bucket = bucketMap.get(bucketKey);

    if (!bucket) {
      continue;
    }

    switch (action.action) {
      case "DOCTOR_APPROVED":
        bucket.approvals += 1;
        break;
      case "DOCTOR_CHANGES_REQUESTED":
      case "DOCTOR_REJECTED":
        bucket.changesRequested += 1;
        break;
      case "USER_SUSPENDED":
        bucket.suspensions += 1;
        break;
      case "USER_ACTIVATED":
        bucket.reactivations += 1;
        break;
      default:
        break;
    }
  }

  const points = Array.from(bucketMap.values());

  return {
    rangeDays: buckets.length,
    summary: {
      approvals: points.reduce((sum, point) => sum + point.approvals, 0),
      changesRequested: points.reduce((sum, point) => sum + point.changesRequested, 0),
      suspensions: points.reduce((sum, point) => sum + point.suspensions, 0),
      activations: points.reduce((sum, point) => sum + point.reactivations, 0)
    },
    points
  };
};
