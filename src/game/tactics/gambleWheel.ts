import type { ResolvedWheel, SliceDefinition } from "../../schemas";
import { patchResolvedWheelSlices } from "../../systems/WheelSystem";

export const GAMBLE_SLICE_IDS = {
  win: "tactic_gamble_win",
  lose: "tactic_gamble_lose",
} as const;

const GAMBLE_WIN_GREEN = "#16A34A";
const GAMBLE_LOSE_RED = "#DC2626";

/** 50/50 — double bank (×2) or wipe bank. Pure green vs red wheel. */
export function buildGambleSlices(): SliceDefinition[] {
  return [
    {
      id: GAMBLE_SLICE_IDS.win,
      kind: "money",
      label: "WIN ALL",
      icon: "arrow-up-bold",
      iconFamily: "MaterialCommunityIcons",
      baseWeight: 50,
      weightTags: ["positive"],
      payload: { bankPercent: 1 },
      presentation: {
        segmentColor: GAMBLE_WIN_GREEN,
        iconColor: "#FFFFFF",
        chipColor: "#BBF7D0",
        captionColor: "#052E16",
      },
    },
    {
      id: GAMBLE_SLICE_IDS.lose,
      kind: "bank_wipe",
      label: "LOSE ALL",
      icon: "arrow-down-bold",
      iconFamily: "MaterialCommunityIcons",
      baseWeight: 50,
      weightTags: ["negative"],
      payload: { wipeBank: true },
      presentation: {
        segmentColor: GAMBLE_LOSE_RED,
        iconColor: "#FFFFFF",
        chipColor: "#FECACA",
        captionColor: "#450A0A",
      },
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
