import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { RUN_LAYOUT } from "./runLayout";
import { clamp, largeRunUiScale, shouldUseLargeRunUi } from "./largeRunUi";

export { shouldUseLargeRunUi } from "./largeRunUi";

export function useRunChromeMetrics() {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const compact = width < 400 || height < 740;
    const narrow = width < 360;
    const wide = width >= 428;
    const tablet = width >= 600;
    const isPad = Platform.OS === "ios" && Platform.isPad === true;
    const largeUi = shouldUseLargeRunUi({
      width,
      height,
      tablet,
      isPad,
      platformOs: Platform.OS,
    });

    const scale = largeUi
      ? largeRunUiScale(width, height)
      : clamp(width / 390, 0.88, 1.08);

    const layout = {
      loadout: Math.round(RUN_LAYOUT.loadout * scale),
      prizeFlash: Math.round(RUN_LAYOUT.prizeFlash * scale),
      prizeFlashMaxWidth: Math.round(clamp(RUN_LAYOUT.prizeFlashMaxWidth * scale, 340, 520)),
      chipSlot: Math.round(clamp(44 * scale, 44, 58)),
      prizeIconSlot: Math.round(clamp(42 * scale, 42, 56)),
    };

    return {
      width,
      height,
      fontScale,
      compact,
      narrow,
      wide,
      tablet,
      largeUi,
      scale,
      layout,
      bar: {
        minHeight: Math.round(44 * scale),
        padH: clamp(Math.round(12 * scale), 10, 20),
        moneySize: Math.round(clamp(28 * scale, 24, 38)),
        moneyPrefixSize: Math.round(clamp(20 * scale, 17, 28)),
        actionSize: Math.round(clamp(36 * scale, 32, 48)),
        iconSize: Math.round(clamp((narrow ? 20 : 22) * (largeUi ? scale : 1), 20, 28)),
        deltaFontSize: Math.round(clamp(14 * (largeUi ? scale : 1), 13, 17)),
      },
      stage: {
        height: Math.round((largeUi ? 58 : tablet ? 56 : 52) * scale),
        padH: clamp(Math.round(10 * scale), 8, 18),
        padV: 0,
        laserSize: Math.round(32 * scale),
        metaWidth: Math.round(clamp(96 * scale, 88, 128)),
        tagWidth: Math.round(clamp(68 * scale, 60, 88)),
        pipSize: Math.round(clamp(30 * scale, 26, 38)),
        pipIcon: Math.round(clamp(15 * scale, 13, 19)),
        mainIcon: Math.round(clamp(20 * scale, 18, 26)),
        cycleFontSize: Math.round(clamp(14 * scale, 14, 18)),
        tagFontSize: Math.round(clamp(13 * scale, 13, 17)),
        progressFontSize: Math.round(clamp(10 * scale, 10, 13)),
        laserIconSize: Math.round(clamp(16 * scale, 16, 20)),
      },
      wheelHud: {
        minHeight: Math.round(42 * scale),
        padH: clamp(Math.round(14 * scale), 12, 22),
        chipIconSize: Math.round(clamp(20 * scale, 20, 26)),
        chipFontSize: Math.round(clamp(20 * scale, 20, 26)),
        chipDeltaFontSize: Math.round(clamp(14 * scale, 14, 18)),
        btnIconSize: Math.round(clamp(22 * scale, 22, 28)),
        btnFontSize: Math.round(clamp(15 * scale, 15, 19)),
      },
      prizeFlash: {
        lineFontSize: Math.round(clamp(22 * scale, 22, 28)),
        subFontSize: Math.round(clamp(12 * scale, 12, 15)),
        idleIconSize: Math.round(clamp(26 * scale, 26, 32)),
        badgeFontSize: Math.round(clamp(11 * scale, 11, 14)),
      },
      notice: {
        maxWidth: Math.round(clamp(340 * scale, 340, 460)),
        titleFontSize: Math.round(clamp(14 * scale, 14, 18)),
        bodyFontSize: Math.round(clamp(11 * scale, 11, 14)),
        iconSize: Math.round(clamp(14 * scale, 14, 18)),
      },
      hairline: 1,
      accentStroke: 2,
    };
  }, [width, height, fontScale]);
}

export type RunChromeMetrics = ReturnType<typeof useRunChromeMetrics>;
