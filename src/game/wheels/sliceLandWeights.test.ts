import { describe, expect, it } from "vitest";
import type { SliceDefinition } from "../../schemas";
import { redistributeSliceLandWeights } from "./sliceLandWeights";

function slice(id: string, baseWeight: number): SliceDefinition {
  return {
    id,
    kind: "money",
    label: id,
    icon: "attach-money",
    iconFamily: "MaterialIcons",
    baseWeight,
    payload: { moneyDelta: 10 },
  };
}

describe("redistributeSliceLandWeights", () => {
  it("sums land chances to 100 after removing a wedge", () => {
    const before = [slice("a", 20), slice("b", 20), slice("c", 20), slice("d", 20), slice("e", 20)];
    const after = redistributeSliceLandWeights(before.filter((s) => s.id !== "e"));
    const sum = after.reduce((s, x) => s + x.baseWeight, 0);
    expect(sum).toBe(100);
    expect(after).toHaveLength(4);
  });
});
