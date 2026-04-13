import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAccountStatusBreakdown,
  buildDoctorVerificationPipeline,
  buildRoleDistribution,
  buildUserGrowthDataset
} from "./dashboardAnalytics.js";

test("buildUserGrowthDataset groups registrations by day and role", () => {
  const result = buildUserGrowthDataset(
    [
      { role: "PATIENT", createdAt: "2026-04-10T08:00:00.000Z" },
      { role: "DOCTOR", createdAt: "2026-04-10T10:00:00.000Z" },
      { role: "ADMIN", createdAt: "2026-04-11T09:00:00.000Z" }
    ],
    3,
    new Date("2026-04-12T12:00:00.000Z")
  );

  assert.equal(result.rangeDays, 3);
  assert.equal(result.totalNewUsers, 3);
  assert.equal(result.newPatients, 1);
  assert.equal(result.newDoctors, 1);
  assert.equal(result.newAdmins, 1);
  assert.deepEqual(
    result.points.map((point) => ({
      date: point.date,
      total: point.total,
      patients: point.patients,
      doctors: point.doctors,
      admins: point.admins
    })),
    [
      { date: "2026-04-10", total: 2, patients: 1, doctors: 1, admins: 0 },
      { date: "2026-04-11", total: 1, patients: 0, doctors: 0, admins: 1 },
      { date: "2026-04-12", total: 0, patients: 0, doctors: 0, admins: 0 }
    ]
  );
});

test("buildRoleDistribution returns normalized role counts", () => {
  assert.deepEqual(
    buildRoleDistribution({ totalPatients: 12, totalDoctors: 4, totalAdmins: 2 }),
    [
      { key: "PATIENT", label: "Patients", value: 12 },
      { key: "DOCTOR", label: "Doctors", value: 4 },
      { key: "ADMIN", label: "Admins", value: 2 }
    ]
  );
});

test("buildDoctorVerificationPipeline returns normalized doctor statuses", () => {
  assert.deepEqual(
    buildDoctorVerificationPipeline({
      pending: 3,
      approved: 7,
      changesRequested: 2,
      rejected: 1
    }),
    [
      { key: "PENDING", label: "Pending", value: 3 },
      { key: "APPROVED", label: "Approved", value: 7 },
      { key: "CHANGES_REQUESTED", label: "Changes Requested", value: 2 },
      { key: "REJECTED", label: "Rejected", value: 1 }
    ]
  );
});

test("buildAccountStatusBreakdown returns normalized account statuses", () => {
  assert.deepEqual(
    buildAccountStatusBreakdown({ active: 15, pending: 4, suspended: 2, locked: 1 }),
    [
      { key: "ACTIVE", label: "Active", value: 15 },
      { key: "PENDING", label: "Pending", value: 4 },
      { key: "SUSPENDED", label: "Suspended", value: 2 },
      { key: "LOCKED", label: "Locked", value: 1 }
    ]
  );
});
