import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Scale run HUD chrome for phones from SE → Pro Max without fixed oversized boxes. */
export function useRunChromeMetrics() {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const compact = width < 400 || height < 740;
    const narrow = width < 360;
    const wide = width >= 428;

    const scale = clamp(width / 390, 0.88, 1.08);

    return {
      width,
      height,
      fontScale,
      compact,
      narrow,
      wide,
      scale,
      bar: {
        minHeight: Math.round(44 * scale),
        padH: clamp(Math.round(12 * scale), 10, 16),
        moneySize: Math.round(clamp(28 * scale, 24, 32)),
        moneyPrefixSize: Math.round(clamp(20 * scale, 17, 24)),
        actionSize: Math.round(clamp(36 * scale, 32, 40)),
        iconSize: narrow ? 20 : 22,
      },
      stage: {
        minHeight: compact ? Math.round(54 * scale) : Math.round(48 * scale),
        padH: clamp(Math.round(12 * scale), 10, 16),
        padV: 6,
        wheelMaxWidth: narrow ? width * 0.42 : compact ? width * 0.38 : 168,
        iconSize: compact ? 16 : 18,
        iconBox: compact ? 26 : 28,
        titleSize: compact ? 13 : 14,
        subSize: 11,
        pipSize: compact ? 24 : 26,
        pipCurrent: compact ? 28 : 30,
        laserSize: 32,
      },
      wheelHud: {
        minHeight: Math.round(42 * scale),
        padH: clamp(Math.round(14 * scale), 12, 18),
      },
      hairline: 1,
      accentStroke: 2,
    };
  }, [width, height, fontScale]);
}

export type RunChromeMetrics = ReturnType<typeof useRunChromeMetrics>;
