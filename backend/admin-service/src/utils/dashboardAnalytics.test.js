import test from "node:test";
import assert from "node:assert/strict";
import { buildAdminActionTrend } from "./dashboardAnalytics.js";

test("buildAdminActionTrend groups admin actions by day and category", () => {
  const result = buildAdminActionTrend(
    [
      { action: "DOCTOR_APPROVED", createdAt: "2026-04-10T08:00:00.000Z" },
      { action: "DOCTOR_CHANGES_REQUESTED", createdAt: "2026-04-10T09:00:00.000Z" },
      { action: "USER_SUSPENDED", createdAt: "2026-04-11T10:00:00.000Z" },
      { action: "USER_ACTIVATED", createdAt: "2026-04-12T11:00:00.000Z" }
    ],
    3,
    new Date("2026-04-12T14:00:00.000Z")
  );

  assert.equal(result.rangeDays, 3);
  assert.deepEqual(result.summary, {
    approvals: 1,
    changesRequested: 1,
    suspensions: 1,
    activations: 1
  });
  assert.deepEqual(result.points, [
    {
      date: "2026-04-10",
      label: "Apr 10",
      approvals: 1,
      changesRequested: 1,
      suspensions: 0,
      reactivations: 0
    },
    {
      date: "2026-04-11",
      label: "Apr 11",
      approvals: 0,
      changesRequested: 0,
      suspensions: 1,
      reactivations: 0
    },
    {
      date: "2026-04-12",
      label: "Apr 12",
      approvals: 0,
      changesRequested: 0,
      suspensions: 0,
      reactivations: 1
    }
  ]);
});
