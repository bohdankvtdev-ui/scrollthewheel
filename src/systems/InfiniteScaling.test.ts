import { describe, expect, it } from "vitest";
import { getScalingParams, applyScalingToSliceWeight } from "./InfiniteScaling";
import type { SliceDefinition } from "../schemas";

describe("InfiniteScaling", () => {
  it("scales params with floor", () => {
    const f1 = getScalingParams(1);
    const f3 = getScalingParams(3);
    expect(f3.negativeWeightMult).toBeGreaterThan(f1.negativeWeightMult);
    expect(f3.stakesMult).toBeGreaterThan(f1.stakesMult);
    expect(f3.blindLabel).toBeTruthy();
  });

  it("boosts negative slice weights", () => {
    const slice: SliceDefinition = {
      id: "x",
      kind: "money_loss",
      label: "L",
      icon: "x",
      iconFamily: "MaterialIcons",
      baseWeight: 2,
      weightTags: ["negative"],
      payload: {},
    };
    const w1 = applyScalingToSliceWeight(slice, getScalingParams(1));
    const w5 = applyScalingToSliceWeight(slice, getScalingParams(5));
    expect(w5).toBeGreaterThan(w1);
  });
});
