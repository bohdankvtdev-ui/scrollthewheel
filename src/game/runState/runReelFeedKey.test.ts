import { describe, expect, it } from "vitest";
import { runReelUiKey } from "./runReelFeedKey";

describe("runReelUiKey", () => {
  it("does not change when only isSpinning toggles (feed must not remount mid-spin)", () => {
    const idle = runReelUiKey({
      awaitingClaim: false,
      gambleFlipActive: false,
      lastResultLabel: null,
    });
    const spinningUi = runReelUiKey({
      awaitingClaim: false,
      gambleFlipActive: false,
      lastResultLabel: "+$5",
    });
    expect(idle).toBe("0|0|");
    expect(spinningUi).toBe("0|0|+$5");
    expect(idle).not.toBe(spinningUi);
  });
});
