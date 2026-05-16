import { describe, expect, it } from "vitest";
import { GameContent } from "./ContentRegistry";
import { WHEEL_COUNT } from "./loop";

describe("GameContent", () => {
  it("validates pipeline pools", () => {
    const { ok, errors } = GameContent.validate();
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it("builds floor pipeline", () => {
    expect(GameContent.getWheelPipeline(2)).toHaveLength(WHEEL_COUNT);
  });

  it("snapshot includes shop tree", () => {
    const snap = GameContent.snapshot();
    expect(snap.shopTree.length).toBeGreaterThan(0);
    expect(snap.wheelRotation.length).toBe(9);
  });
});
