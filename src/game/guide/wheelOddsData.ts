import { getSliceProbabilities } from "../../systems/ProbabilityResolver";
import { DEFAULT_RESOLVE_CONTEXT } from "../../systems/types";
import {
  getConfiguredWheelSlices,
  getWheelConfig,
} from "../wheels/database/loader";
import { FLOOR_WHEEL_ORDER } from "../wheels/database/wheelDatabase";
import type { WheelConfigId } from "../wheels/database/types";

export type WheelOddsRow = {
  label: string;
  landPct: number;
  spinPct: number;
  kind: string;
  tags: string;
};

export type WheelOddsSnapshot = {
  configId: WheelConfigId;
  title: string;
  archetype: string;
  cycle: number;
  sliceCount: number;
  landSum: number;
  rows: WheelOddsRow[];
};

const PREVIEW_CYCLES = [1, 2, 3, 5, 10] as const;
export type PreviewCycle = (typeof PREVIEW_CYCLES)[number];
export { PREVIEW_CYCLES };

export function buildWheelOddsSnapshot(
  configId: WheelConfigId,
  cycle: number
): WheelOddsSnapshot {
  const entry = getWheelConfig(configId);
  const ctx = { runId: "__odds_preview__", cycle, ownedPerks: [] as string[] };
  const slices = getConfiguredWheelSlices(configId, configId, ctx);
  const probs = getSliceProbabilities(slices, DEFAULT_RESOLVE_CONTEXT);

  const rows: WheelOddsRow[] = slices.map((slice) => {
    const p = probs.find((r) => r.id === slice.id);
    return {
      label: slice.label,
      landPct: slice.baseWeight,
      spinPct: p != null ? Math.round(p.probability * 1000) / 10 : 0,
      kind: slice.kind,
      tags: (slice.weightTags ?? []).join(", ") || "—",
    };
  });

  return {
    configId,
    title: entry.title,
    archetype: entry.archetype,
    cycle,
    sliceCount: slices.length,
    landSum: Math.round(rows.reduce((s, r) => s + r.landPct, 0) * 10) / 10,
    rows,
  };
}

export function buildAllWheelOdds(cycle: number): WheelOddsSnapshot[] {
  return FLOOR_WHEEL_ORDER.map((id) => buildWheelOddsSnapshot(id, cycle));
}
