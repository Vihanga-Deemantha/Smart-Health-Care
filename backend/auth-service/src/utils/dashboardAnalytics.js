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
      date,
      label: formatBucketLabel(date)
    };
  });
};

export const buildUserGrowthDataset = (users = [], days = 14, now = new Date()) => {
  const buckets = buildRecentDayBuckets(days, now);
  const bucketMap = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        date: bucket.key,
        label: bucket.label,
        total: 0,
        patients: 0,
        doctors: 0,
        admins: 0
      }
    ])
  );

  for (const user of users) {
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;

    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      continue;
    }

    const bucketKey = createdAt.toISOString().slice(0, 10);
    const bucket = bucketMap.get(bucketKey);

    if (!bucket) {
      continue;
    }

    bucket.total += 1;

    if (user.role === "PATIENT") {
      bucket.patients += 1;
    } else if (user.role === "DOCTOR") {
      bucket.doctors += 1;
    } else if (user.role === "ADMIN") {
      bucket.admins += 1;
    }
  }

  const points = Array.from(bucketMap.values());

  return {
    rangeDays: buckets.length,
    totalNewUsers: points.reduce((sum, point) => sum + point.total, 0),
    newPatients: points.reduce((sum, point) => sum + point.patients, 0),
    newDoctors: points.reduce((sum, point) => sum + point.doctors, 0),
    newAdmins: points.reduce((sum, point) => sum + point.admins, 0),
    points
  };
};

export const buildRoleDistribution = ({
  totalPatients = 0,
  totalDoctors = 0,
  totalAdmins = 0
}) => {
  return [
    { key: "PATIENT", label: "Patients", value: Number(totalPatients) || 0 },
    { key: "DOCTOR", label: "Doctors", value: Number(totalDoctors) || 0 },
    { key: "ADMIN", label: "Admins", value: Number(totalAdmins) || 0 }
  ];
};

export const buildDoctorVerificationPipeline = ({
  pending = 0,
  approved = 0,
  changesRequested = 0,
  rejected = 0
}) => {
  return [
    { key: "PENDING", label: "Pending", value: Number(pending) || 0 },
    { key: "APPROVED", label: "Approved", value: Number(approved) || 0 },
    {
      key: "CHANGES_REQUESTED",
      label: "Changes Requested",
      value: Number(changesRequested) || 0
    },
    { key: "REJECTED", label: "Rejected", value: Number(rejected) || 0 }
  ];
};

export const buildAccountStatusBreakdown = ({
  active = 0,
  pending = 0,
  suspended = 0,
  locked = 0
}) => {
  return [
    { key: "ACTIVE", label: "Active", value: Number(active) || 0 },
    { key: "PENDING", label: "Pending", value: Number(pending) || 0 },
    { key: "SUSPENDED", label: "Suspended", value: Number(suspended) || 0 },
    { key: "LOCKED", label: "Locked", value: Number(locked) || 0 }
  ];
};
