import { WHEEL_COUNT } from "./catalogs/wheel-pipeline.catalog";
import { RUN_DEFAULTS } from "./config/run.defaults";

/**
 * High-level run flow — code in `RunManager` implements this blueprint.
 */
export const RUN_BLUEPRINT = {
  version: 1,
  wheelsPerFloor: WHEEL_COUNT,
  phases: ["active", "won", "lost_money", "lost_boss"] as const,
  loop: {
    /** After wheel index reaches count, if boss dead → next floor */
    infiniteFloors: true,
    /** Rebuild all wheels from pipeline + scaling on floor enter */
    rebuildWheelsOnFloorEnter: true,
  },
  economy: {
    startMoney: RUN_DEFAULTS.startingMoney,
    bankruptcyAt: RUN_DEFAULTS.bankruptcyThreshold,
  },
  spin: {
    /** One spin per wheel index while phase is active */
    oneSpinPerWheel: true,
    /** Swipe or hub claim advances `wheelIndex` */
    manualClaimBetweenWheels: true,
  },
  win: {
    /** Final pipeline wheel role */
    bossRole: "boss" as const,
    /** Phase set to `won` when boss HP hits 0 */
    onBossDefeated: "won" as const,
  },
} as const;

export type RunBlueprint = typeof RUN_BLUEPRINT;
