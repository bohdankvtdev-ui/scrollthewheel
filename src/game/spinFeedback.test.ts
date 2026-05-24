import { describe, expect, it } from "vitest";
import {
  bulbPhaseForFeedback,
  feedbackVisual,
  WASH_FLASH_MS,
  resolveSpinFeedback,
  shouldPlayWashFlash,
  washFlashIntensity,
  isFlashWashTier,
  isGainTier,
  isLossTier,
} from "./spinFeedback";

describe("spinFeedback", () => {
  it("classifies jackpots and wipes", () => {
    expect(resolveSpinFeedback({ moneyReveal: { before: 100, delta: 600 } })).toBe("gain_jackpot");
    expect(resolveSpinFeedback({ moneyReveal: { before: 400, delta: -400 } })).toBe("loss_wipe");
  });

  it("maps tiers to bulb phases", () => {
    expect(bulbPhaseForFeedback("gain_jackpot")).toBe("jackpot");
    expect(bulbPhaseForFeedback("loss_large")).toBe("damage");
    expect(bulbPhaseForFeedback("neutral")).toBe("idle");
  });

  it("shield block is neutral", () => {
    expect(
      resolveSpinFeedback({
        moneyReveal: { before: 200, delta: -100 },
        shieldBlocked: true,
      })
    ).toBe("neutral");
  });

  it("exposes page wash colors per tier", () => {
    expect(feedbackVisual("gain_small")?.wash).toMatch(/^#/);
    expect(feedbackVisual("loss_small")?.wash).toBe("#FF3B4D");
    expect(feedbackVisual("neutral")?.wash).toMatch(/^#/);
  });

  it("money wash flash is 300ms", () => {
    expect(WASH_FLASH_MS).toBe(300);
  });

  it("plays wash only once per epoch", () => {
    expect(shouldPlayWashFlash(1)).toBe(true);
    expect(shouldPlayWashFlash(1)).toBe(false);
    expect(shouldPlayWashFlash(2)).toBe(true);
  });

  it("scales wash intensity by tier", () => {
    expect(washFlashIntensity("gain_small").peak).toBeLessThan(washFlashIntensity("gain_large").peak);
    expect(washFlashIntensity("loss_small").peak).toBeLessThan(washFlashIntensity("loss_wipe").peak);
    expect(washFlashIntensity("gain_jackpot").peak).toBe(1);
  });

  it("flash wash tiers are money gain and loss", () => {
    expect(isFlashWashTier("gain_small")).toBe(true);
    expect(isFlashWashTier("loss_medium")).toBe(true);
    expect(isFlashWashTier("neutral")).toBe(false);
  });

  it("gain and loss tier guards", () => {
    expect(isGainTier("gain_small")).toBe(true);
    expect(isLossTier("loss_medium")).toBe(true);
    expect(isGainTier("loss_small")).toBe(false);
  });
});
