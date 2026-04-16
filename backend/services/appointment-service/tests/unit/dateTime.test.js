import { buildSlots, buildSlotsFromTimeRange } from "../../src/utils/dateTime.js";

describe("dateTime.buildSlots", () => {
  it("should generate slots between two hours", () => {
    const slots = buildSlots({
      date: new Date("2026-04-11T00:00:00.000Z"),
      startHour: 9,
      endHour: 10,
      durationMinutes: 30,
      bufferMinutes: 0
    });

    expect(slots).toHaveLength(2);
  });

  it("should generate slots between two times", () => {
    const slots = buildSlotsFromTimeRange({
      date: new Date("2026-04-11T00:00:00.000Z"),
      startTime: "09:30",
      endTime: "10:30",
      durationMinutes: 30,
      bufferMinutes: 0
    });

    expect(slots).toHaveLength(2);
  });
});
