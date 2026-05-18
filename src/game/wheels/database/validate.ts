import { getSliceProbabilities } from "../../../systems/ProbabilityResolver";
import { DEFAULT_RESOLVE_CONTEXT } from "../../../systems/types";
import { MIN_SLICE_COUNT, MAX_SLICE_COUNT } from "../../../schemas/wheel.schema";
import { getSliceCountForCycle } from "../../cycle/cycleProgression";
import { WHEEL_THEME_KINDS } from "./constants";
import { getConfiguredWheelSlices, getPrizeSlotsForWheel, getWheelConfig } from "./loader";
import { PRIZE_CATALOG, type PrizeCatalogId } from "./prizeCatalog";
import { FLOOR_WHEEL_ORDER } from "./wheelDatabase";
import type { WheelPrizeSlot } from "./types";
import type { WheelConfigId } from "./types";

export type WheelValidationIssue = {
  wheelId: WheelConfigId;
  message: string;
};

const CHANCE_TOLERANCE = 0.5;
const VALIDATE_CTX = { runId: "__validate__", cycle: 1, ownedPerks: [] as string[] };

export function validateWheelChances(configId: WheelConfigId, cycle = 1): WheelValidationIssue[] {
  const entry = getWheelConfig(configId);
  const prizes = getPrizeSlotsForWheel(configId, { ...VALIDATE_CTX, cycle });
  return validatePrizeSlotList(configId, prizes, entry.archetype, cycle);
}

function validatePrizeSlotList(
  wheelId: string,
  prizes: WheelPrizeSlot[],
  archetype: keyof typeof WHEEL_THEME_KINDS,
  cycle: number
): WheelValidationIssue[] {
  const issues: WheelValidationIssue[] = [];
  const expected = getSliceCountForCycle(cycle);
  if (prizes.length < MIN_SLICE_COUNT || prizes.length > MAX_SLICE_COUNT) {
    issues.push({
      wheelId,
      message: `Expected ${MIN_SLICE_COUNT}–${MAX_SLICE_COUNT} prizes, got ${prizes.length}`,
    });
  } else if (prizes.length !== expected && wheelId !== "wheel_4") {
    /* perk wheel may differ with advancements */
  }
  const sum = prizes.reduce((s, row) => s + row.chance, 0);
  if (Math.abs(sum - 100) > CHANCE_TOLERANCE) {
    issues.push({
      wheelId,
      message: `Land chances sum to ${sum.toFixed(1)}% (expected ~100%)`,
    });
  }
  const allowedKinds = WHEEL_THEME_KINDS[archetype];
  for (const row of prizes) {
    const def = PRIZE_CATALOG[row.prize as PrizeCatalogId];
    if (def == null) {
      issues.push({ wheelId, message: `Unknown prize "${row.prize}"` });
    } else if (!allowedKinds.includes(def.kind)) {
      issues.push({
        wheelId,
        message: `"${row.prize}" (${def.kind}) does not match ${archetype} theme`,
      });
    }
  }
  return issues;
}

export function validateAllWheels(): WheelValidationIssue[] {
  const issues = FLOOR_WHEEL_ORDER.flatMap((id) => validateWheelChances(id, 1));
  return [...issues, ...validateWheelChances("wheel_2", 2)];
}

export function formatWheelOddsReport(configId: WheelConfigId, instanceId = configId): string {
  const entry = getWheelConfig(configId);
  const prizes = getPrizeSlotsForWheel(configId, VALIDATE_CTX);
  const slices = getConfiguredWheelSlices(configId, instanceId, VALIDATE_CTX);
  const rows = getSliceProbabilities(slices, DEFAULT_RESOLVE_CONTEXT);

  const header = `=== ${entry.title} (${configId}) · ${entry.archetype} ===`;
  const chanceNote = `slices: ${prizes.length} · land % sum: ${prizes.reduce((s, p) => s + p.chance, 0)}%`;

  const lines = [
    header,
    chanceNote,
    "prize | label | cfg% | spin% | tags",
    "------|-------|------|-------|-----",
  ];

  for (const r of rows) {
    lines.push(
      `${r.id.split("_").slice(1).join("_")} | ${r.label} | ${r.effectiveWeight.toFixed(1)} | ${(r.probability * 100).toFixed(1)}% | ${r.weightTags.join(",") || "—"}`
    );
  }

  return lines.join("\n");
}

export function formatAllWheelsReport(): string {
  return FLOOR_WHEEL_ORDER.map((id) => formatWheelOddsReport(id)).join("\n\n");
}

export function assertAllWheelsValid(): void {
  const issues = validateAllWheels();
  if (issues.length > 0) {
    const msg = issues.map((i) => `[${i.wheelId}] ${i.message}`).join("\n");
    throw new Error(`Wheel database validation failed:\n${msg}`);
  }
}
