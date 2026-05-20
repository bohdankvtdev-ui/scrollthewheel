import { describe, expect, it } from "vitest";
import { chipRevealDurationMs, projectedChips } from "./chipReveal";

describe("chipReveal", () => {
  it("projects chip total", () => {
    expect(projectedChips({ before: 5, delta: 3 })).toBe(8);
  });

  it("uses shorter duration for small gains", () => {
    expect(chipRevealDurationMs({ before: 0, delta: 2 })).toBe(950);
    expect(chipRevealDurationMs({ before: 0, delta: 12 })).toBe(1100);
  });
});
