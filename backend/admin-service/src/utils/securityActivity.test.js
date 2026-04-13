import test from "node:test";
import assert from "node:assert/strict";
import { buildSecurityActivityFeed } from "./securityActivity.js";

test("buildSecurityActivityFeed merges, sorts, and paginates auth and admin events", () => {
  const result = buildSecurityActivityFeed({
    authLogs: [
      {
        _id: "auth-1",
        action: "LOGIN_SUCCESS",
        createdAt: "2026-04-12T10:00:00.000Z",
        userId: "user-1",
        email: "doctor@example.com",
        ipAddress: "127.0.0.1",
        userAgent: "agent",
        metadata: { role: "DOCTOR" }
      },
      {
        _id: "auth-2",
        action: "ACCOUNT_SUSPENDED",
        createdAt: "2026-04-12T11:00:00.000Z",
        userId: "user-2",
        email: "patient@example.com",
        ipAddress: "127.0.0.2",
        userAgent: "agent-2",
        metadata: { adminUserId: "admin-1" }
      }
    ],
    adminActions: [
      {
        _id: "admin-1",
        action: "USER_SUSPENDED",
        createdAt: "2026-04-12T10:30:00.000Z",
        adminUserId: "admin-1",
        targetUserId: "user-2",
        reason: "Policy violation"
      }
    ],
    authTotal: 2,
    adminTotal: 1,
    page: 1,
    limit: 2
  });

  assert.equal(result.events.length, 2);
  assert.equal(result.events[0].id, "auth-auth-2");
  assert.equal(result.events[1].id, "admin-admin-1");
  assert.equal(result.pagination.total, 3);
  assert.equal(result.pagination.pages, 2);
});

test("buildSecurityActivityFeed maps missing optional fields to null-safe values", () => {
  const result = buildSecurityActivityFeed({
    authLogs: [
      {
        _id: "auth-3",
        action: "OTP_SENT",
        createdAt: "2026-04-12T09:00:00.000Z"
      }
    ],
    adminActions: [],
    authTotal: 1,
    adminTotal: 0,
    page: 1,
    limit: 10
  });

  assert.deepEqual(result.events[0], {
    id: "auth-auth-3",
    type: "AUTH_LOG",
    action: "OTP_SENT",
    createdAt: "2026-04-12T09:00:00.000Z",
    actorUserId: null,
    actorEmail: null,
    targetUserId: null,
    reason: null,
    ipAddress: null,
    userAgent: null,
    metadata: {}
  });
});
