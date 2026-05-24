import { describe, expect, it } from "vitest";
import {
  canConsumeSpinSession,
  consumeSpinSession,
  isDuplicateSpinResultApply,
  type ActiveSpinSession,
} from "./spinCompletion";

describe("spinCompletion", () => {
  it("blocks duplicate apply when claim is already pending for the same slice", () => {
    expect(
      isDuplicateSpinResultApply(
        { isSpinning: false, awaitingClaim: true, lastSliceId: "money_100" },
        3,
        3,
        "money_100"
      )
    ).toBe(true);
  });

  it("allows apply while still spinning", () => {
    expect(
      isDuplicateSpinResultApply(
        { isSpinning: true, awaitingClaim: false, lastSliceId: null },
        3,
        3,
        "money_100"
      )
    ).toBe(false);
  });

  it("duplicate apply guard blocks repeat claim for same slice on same wheel", () => {
    expect(
      isDuplicateSpinResultApply(
        { isSpinning: false, awaitingClaim: true, lastSliceId: "builder_a" },
        6,
        6,
        "builder_a"
      )
    ).toBe(true);
  });

  it("spin session can only be consumed once", () => {
    const session: ActiveSpinSession = {
      wheelIndex: 2,
      sliceId: "x",
      sliceIndex: 0,
      slice: {
        id: "x",
        label: "X",
        kind: "money",
        icon: "cash",
        iconFamily: "MaterialCommunityIcons",
        baseWeight: 1,
        payload: {},
      },
      consumed: false,
    };
    expect(canConsumeSpinSession(session)).toBe(true);
    consumeSpinSession(session);
    expect(canConsumeSpinSession(session)).toBe(false);
  });
});
