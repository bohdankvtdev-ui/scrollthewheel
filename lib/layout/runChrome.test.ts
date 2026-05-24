import { describe, expect, it } from "vitest";
import { largeRunUiScale, shouldUseLargeRunUi } from "./largeRunUi";

describe("largeRunUi", () => {
  it("shouldUseLargeRunUi enables tablet, iPad, wide, and web viewports", () => {
    expect(
      shouldUseLargeRunUi({ width: 390, height: 844, tablet: false, platformOs: "ios" })
    ).toBe(false);
    expect(
      shouldUseLargeRunUi({ width: 768, height: 1024, tablet: true, platformOs: "ios" })
    ).toBe(true);
    expect(
      shouldUseLargeRunUi({ width: 820, height: 1180, isPad: true, platformOs: "ios" })
    ).toBe(true);
    expect(shouldUseLargeRunUi({ width: 1024, height: 768, platformOs: "web" })).toBe(true);
    expect(
      shouldUseLargeRunUi({ width: 900, height: 520, platformOs: "web", tablet: false })
    ).toBe(true);
  });

  it("largeRunUiScale grows with viewport but stays capped", () => {
    expect(largeRunUiScale(600, 900)).toBeCloseTo(1.06, 2);
    expect(largeRunUiScale(768, 1024)).toBeCloseTo(1.28, 2);
    expect(largeRunUiScale(1200, 900)).toBe(1.38);
  });
});
