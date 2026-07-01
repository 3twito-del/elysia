import { describe, expect, it } from "vitest";

import { courseProgress, enrollmentStatus } from "./lms";

describe("courseProgress", () => {
  it("computes a rounded percentage, capped", () => {
    expect(courseProgress(3, 4)).toBe(75);
    expect(courseProgress(5, 4)).toBe(100);
    expect(courseProgress(0, 0)).toBe(0);
  });
});

describe("enrollmentStatus", () => {
  it("derives status from progress", () => {
    expect(enrollmentStatus(0, 4)).toBe("ENROLLED");
    expect(enrollmentStatus(2, 4)).toBe("IN_PROGRESS");
    expect(enrollmentStatus(4, 4)).toBe("COMPLETED");
  });
});
