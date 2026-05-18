import { ADVANCEMENT_CATALOG } from "../advancements/advancementCatalog";
import { CHIP_FORGE_CATALOG } from "../shop/chipForge";
import { PERK_CATALOG } from "../../data/perks";
import { buildResolveContext } from "../../hooks/useWheelModifiers";
import { getSliceProbabilities } from "../../systems/ProbabilityResolver";
import type { RunState } from "../../schemas";
import { FLOOR_WHEEL_ORDER } from "./database/wheelDatabase";
import { getArchetypeForConfigId } from "./database/loader";
import type { WheelConfigId } from "./database/types";
import { getCapacitySliceBonus, POST_BUILDER_MIN_SLICE_CAPACITY } from "./sliceCapacityBonus";
import { getWheelArchetypeMeta } from "../../data/wheelArchetypeMeta";

export type WheelSliceOddsRow = {
  label: string;
  kind: string;
  landPct: number;
};

export type WheelOddsSection = {
  wheelIndex: number;
  configId: WheelConfigId;
  title: string;
  archetypeTag: string;
  sliceCount: number;
  slices: WheelSliceOddsRow[];
  isCurrent: boolean;
  isPast: boolean;
};

export type RunOddsUpgradeLine = {
  id: string;
  label: string;
  detail: string;
};

export type RunWheelOddsReport = {
  globalCapacity: number;
  capacityBonus: number;
  postBuilderFloor: number;
  wheels: WheelOddsSection[];
  upgrades: RunOddsUpgradeLine[];
  spinModifiers: { label: string; value: string }[];
};

function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function buildRunWheelOddsReport(run: RunState): RunWheelOddsReport {
  const capacityBonus = getCapacitySliceBonus(run);
  const wheels: WheelOddsSection[] = FLOOR_WHEEL_ORDER.map((configId, wheelIndex) => {
    const wheel = run.wheels[wheelIndex] ?? null;
    const meta = getWheelArchetypeMeta(getArchetypeForConfigId(configId));
    const ctx = buildResolveContext(run, wheel, wheelIndex);
    const probs = wheel != null ? getSliceProbabilities(wheel.slices, ctx) : [];
    return {
      wheelIndex,
      configId,
      title: meta.tag,
      archetypeTag: meta.tag,
      sliceCount: wheel?.slices.length ?? 0,
      isCurrent: wheelIndex === run.wheelIndex,
      isPast: wheelIndex < run.wheelIndex,
      slices: probs.map((p) => ({
        label: p.label,
        kind: p.kind,
        landPct: p.probability * 100,
      })),
    };
  });

  const upgrades: RunOddsUpgradeLine[] = [];
  if (capacityBonus > 0) {
    upgrades.push({
      id: "capacity",
      label: `+${capacityBonus} wedge${capacityBonus > 1 ? "s" : ""} on every wheel`,
      detail: `Run capacity ${run.sliceCapacity} (cycle baseline + bonus)`,
    });
  }
  if (run.wheelIndex >= 7 && run.sliceCapacity >= POST_BUILDER_MIN_SLICE_CAPACITY) {
    upgrades.push({
      id: "post_builder",
      label: "Builder cleared",
      detail: `Wheels after builder use at least ${POST_BUILDER_MIN_SLICE_CAPACITY} wedges`,
    });
  }
  for (const id of run.advancements ?? []) {
    const def = ADVANCEMENT_CATALOG[id];
    if (def != null) {
      upgrades.push({ id, label: def.name, detail: def.line });
    }
  }
  for (const perkId of run.perks) {
    const p = PERK_CATALOG[perkId];
    if (p != null) {
      upgrades.push({
        id: `perk_${perkId}`,
        label: p.name,
        detail: p.description ?? "Active perk",
      });
    }
  }
  const forge = run.chipForge ?? {};
  for (const [id, lvl] of Object.entries(forge)) {
    if ((lvl ?? 0) <= 0) continue;
    const def = CHIP_FORGE_CATALOG[id as keyof typeof CHIP_FORGE_CATALOG];
    if (def != null) {
      upgrades.push({
        id: `forge_${id}`,
        label: `${def.name} Lv.${lvl}`,
        detail: def.line,
      });
    }
  }

  const currentWheel = run.wheels[run.wheelIndex] ?? null;
  const spinCtx = buildResolveContext(run, currentWheel, run.wheelIndex);
  const spinModifiers = [
    { label: "Positive bias", value: `×${spinCtx.positiveWeightMult.toFixed(2)}` },
    { label: "Negative bias", value: `×${spinCtx.negativeWeightMult.toFixed(2)}` },
    { label: "Rare bias", value: `×${spinCtx.rareWeightMult.toFixed(2)}` },
  ];
  if ((spinCtx.wheelNegativeBias ?? 0) > 0) {
    spinModifiers.push({
      label: "Wheel curse bias",
      value: `+${((spinCtx.wheelNegativeBias ?? 0) * 100).toFixed(0)}%`,
    });
  }

  return {
    globalCapacity: run.sliceCapacity,
    capacityBonus,
    postBuilderFloor: POST_BUILDER_MIN_SLICE_CAPACITY,
    wheels,
    upgrades,
    spinModifiers,
  };
}

export { formatPct };
