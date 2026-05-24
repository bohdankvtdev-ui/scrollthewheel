import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeGameColors } from "../../../theme/homeScreen";
import { mulberry32, wheelClusterCenter } from "./homeOrganicLayout";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type HeroWheelSpec = {
  id: string;
  size: number;
  left: number;
  top: number;
  durationMs: number;
  reverse: boolean;
  zIndex: number;
  colors: readonly string[];
  sliceIcons: readonly IconName[];
  driftAmpX: number;
  driftAmpY: number;
  driftDurationMs: number;
  driftPhase: number;
};

const ICON_SETS: readonly (readonly IconName[])[] = [
  ["currency-usd", "cash-multiple", "diamond-stone", "star-four-points", "lightning-bolt", "shield-star"],
  ["trophy", "medal", "fire", "rocket-launch", "cash", "chart-line-variant"],
  ["circle-multiple", "gift", "flash", "heart", "crown", "numeric-9-circle"],
] as const;

const COLOR_SETS: readonly (readonly string[])[] = [
  [HomeGameColors[0], HomeGameColors[1], HomeGameColors[6], HomeGameColors[2], HomeGameColors[4], HomeGameColors[5]],
  [HomeGameColors[2], HomeGameColors[7], HomeGameColors[1], HomeGameColors[3], HomeGameColors[6], HomeGameColors[0]],
  [HomeGameColors[5], HomeGameColors[3], HomeGameColors[8], HomeGameColors[4], HomeGameColors[1], HomeGameColors[2]],
] as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

type WheelCenter = { x: number; y: number; size: number; id: string; z: number; i: number };

/**
 * Fixed % positions — large wheels, separated (no shrink-to-fit loop).
 * Top: a bit lower · Left: bigger, inward · Right: bigger, much lower.
 */
function layoutWheelCenters(width: number, height: number): WheelCenter[] {
  const { cx } = wheelClusterCenter(width, height);

  const sTop = clamp(Math.round(width * 0.54), 185, 258);
  const sLeft = clamp(Math.round(width * 0.6), 200, 285);
  const sRight = clamp(Math.round(width * 0.64), 210, 305);

  return [
    { id: "hero-top", x: cx, y: height * 0.27, size: sTop, z: 2, i: 0 },
    { id: "hero-bl", x: width * 0.29, y: height * 0.47, size: sLeft, z: 1, i: 1 },
    { id: "hero-br", x: width * 0.73, y: height * 0.63, size: sRight, z: 3, i: 2 },
  ];
}

/** Three large hero wheels on home. */
export function buildHeroWheelCluster(width: number, height: number): HeroWheelSpec[] {
  if (width < 280 || height < 400) return [];

  const rand = mulberry32(0xdec0de);
  const centers = layoutWheelCenters(width, height);

  return centers.map((c) => {
    const nudgeX = (rand() - 0.5) * 4;
    const nudgeY = (rand() - 0.5) * 4;
    const x = c.x + nudgeX;
    const y = c.y + nudgeY;

    return {
      id: c.id,
      size: c.size,
      left: Math.round(x - c.size / 2),
      top: Math.round(y - c.size / 2),
      durationMs: 12000 + c.i * 2500,
      reverse: c.i % 2 === 0,
      zIndex: c.z,
      colors: COLOR_SETS[c.i]!,
      sliceIcons: ICON_SETS[c.i]!,
      driftAmpX: 18 + c.i * 4,
      driftAmpY: 14 + c.i * 3,
      driftDurationMs: [11200, 13800, 9600][c.i] ?? 11000,
      driftPhase: rand(),
    };
  });
}
