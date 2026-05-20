import type { ResolvedWheel, SliceDefinition } from "../../schemas";
import { patchResolvedWheelSlices } from "../../systems/WheelSystem";

export const GAMBLE_SLICE_IDS = {
  win: "tactic_gamble_win",
  lose: "tactic_gamble_lose",
} as const;

/** 50/50 — double bank (×2) or wipe bank. */
export function buildGambleSlices(): SliceDefinition[] {
  return [
    {
      id: GAMBLE_SLICE_IDS.win,
      kind: "money",
      label: "×2",
      icon: "trending-up",
      iconFamily: "MaterialIcons",
      baseWeight: 50,
      weightTags: ["positive"],
      payload: { bankPercent: 1 },
      presentation: { segmentColor: "#22C55E", iconColor: "#052E16" },
    },
    {
      id: GAMBLE_SLICE_IDS.lose,
      kind: "bank_wipe",
      label: "LOSE",
      icon: "trending-down",
      iconFamily: "MaterialIcons",
      baseWeight: 50,
      weightTags: ["negative"],
      payload: { wipeBank: true },
      presentation: { segmentColor: "#EF4444", iconColor: "#450A0A" },
    },
  ];
}

export function getGambleSliceById(sliceId: string): SliceDefinition | undefined {
  return buildGambleSlices().find((s) => s.id === sliceId);
}

/** Replace active wheel view with a 2-slice gamble wheel. */
export function overlayGambleWheel(base: ResolvedWheel): ResolvedWheel {
  return patchResolvedWheelSlices(base, buildGambleSlices());
}
