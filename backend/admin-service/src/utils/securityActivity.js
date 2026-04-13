export const buildSecurityActivityFeed = ({
  authLogs = [],
  adminActions = [],
  adminTotal = 0,
  authTotal = 0,
  page = 1,
  limit = 10
}) => {
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);
  const skip = (normalizedPage - 1) * normalizedLimit;

  const authEvents = authLogs.map((log) => ({
    id: `auth-${log._id}`,
    type: "AUTH_LOG",
    action: log.action,
    createdAt: log.createdAt,
    actorUserId: log.userId || null,
    actorEmail: log.email || null,
    targetUserId: null,
    reason: null,
    ipAddress: log.ipAddress || null,
    userAgent: log.userAgent || null,
    metadata: log.metadata || {}
  }));

  const adminEvents = adminActions.map((action) => ({
    id: `admin-${action._id}`,
    type: "ADMIN_ACTION",
    action: action.action,
    createdAt: action.createdAt,
    actorUserId: action.adminUserId,
    actorEmail: null,
    targetUserId: action.targetUserId,
    reason: action.reason || null,
    ipAddress: null,
    userAgent: null,
    metadata: {}
  }));

  const events = [...authEvents, ...adminEvents]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(skip, skip + normalizedLimit);

  const total = Number(authTotal) + Number(adminTotal);

  return {
    events,
    pagination: {
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      pages: Math.ceil(total / normalizedLimit)
    }
  };
};
