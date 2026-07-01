import { describe, expect, it } from "vitest";

import {
  courseProgress,
  enrollmentStatus,
  isQuizPassed,
  parseQuizOptions,
  scoreQuiz,
} from "./lms";

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

describe("scoreQuiz", () => {
  it("grades responses against the correct answers", () => {
    expect(scoreQuiz([0, 1, 2, 3], [0, 1, 0, 3])).toEqual({
      correct: 3,
      total: 4,
      scorePct: 75,
    });
  });

  it("counts a missing response as wrong and handles an empty quiz", () => {
    expect(scoreQuiz([0], [0, 1]).scorePct).toBe(50);
    expect(scoreQuiz([], [])).toEqual({ correct: 0, total: 0, scorePct: 0 });
  });
});

describe("isQuizPassed", () => {
  it("passes at or above the threshold", () => {
    expect(isQuizPassed(70, 70)).toBe(true);
    expect(isQuizPassed(69, 70)).toBe(false);
  });
});

describe("parseQuizOptions", () => {
  it("reads options and the starred correct answer", () => {
    expect(parseQuizOptions("אדום | ירוק* | כחול")).toEqual({
      options: ["אדום", "ירוק", "כחול"],
      correctIndex: 1,
    });
  });

  it("rejects too few options or no marked answer", () => {
    expect(() => parseQuizOptions("רק אחת*")).toThrow();
    expect(() => parseQuizOptions("א | ב | ג")).toThrow();
  });
});
