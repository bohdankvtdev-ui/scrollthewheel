import { describe, expect, it } from "vitest";
import { computeRunWheelStageDimensions, estimateRunWheelFeedHeight } from "./runStageLayout";

describe("runStageLayout", () => {
  it("estimateRunWheelFeedHeight reserves HUD chrome", () => {
    const h = estimateRunWheelFeedHeight({
      width: 390,
      height: 844,
      fontScale: 1,
      compact: false,
      narrow: false,
      wide: false,
      tablet: false,
      largeUi: false,
      scale: 1,
      layout: {
        loadout: 48,
        prizeFlash: 72,
        prizeFlashMaxWidth: 340,
        chipSlot: 44,
        prizeIconSlot: 42,
      },
      bar: { minHeight: 44, padH: 12, moneySize: 28, moneyPrefixSize: 20, actionSize: 36, iconSize: 22 },
      stage: {
        height: 52,
        padH: 10,
        padV: 0,
        laserSize: 32,
        metaWidth: 118,
        tagWidth: 76,
        pipSize: 30,
        pipIcon: 15,
        mainIcon: 20,
        cycleFontSize: 14,
        tagFontSize: 13,
        progressFontSize: 10,
        laserIconSize: 16,
      },
      wheelHud: { minHeight: 42, padH: 14, chipIconSize: 20, chipFontSize: 20, chipDeltaFontSize: 14, btnIconSize: 22, btnFontSize: 15 },
      prizeFlash: { lineFontSize: 22, subFontSize: 12, idleIconSize: 26, badgeFontSize: 11 },
      notice: { maxWidth: 340, titleFontSize: 14, bodyFontSize: 11, iconSize: 14 },
      hairline: 1,
      accentStroke: 2,
    });
    expect(h).toBeGreaterThan(400);
    expect(h).toBeLessThan(844);
  });

  it("computeRunWheelStageDimensions fits inside slot and grows on tablet slots", () => {
    const phone = computeRunWheelStageDimensions(390, 420, false);
    const tablet = computeRunWheelStageDimensions(768, 560, true);
    expect(phone.stageWidth).toBeLessThanOrEqual(390);
    expect(phone.stageHeight).toBeLessThanOrEqual(420);
    expect(phone.wheelInnerSize).toBeLessThanOrEqual(400);
    expect(tablet.wheelInnerSize).toBeGreaterThan(phone.wheelInnerSize);
    expect(tablet.wheelInnerSize).toBeGreaterThan(400);
  });
});
