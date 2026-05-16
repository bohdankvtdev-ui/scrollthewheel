import { getSliceProbabilities } from "../../../systems/ProbabilityResolver";
import { DEFAULT_RESOLVE_CONTEXT } from "../../../systems/types";
import { getConfiguredWheelSlices, getWheelConfig } from "./loader";
import { FLOOR_WHEEL_ORDER, WHEEL_DATABASE } from "./wheelDatabase";
import type { WheelConfigId } from "./types";

export type WheelValidationIssue = {
  wheelId: WheelConfigId;
  message: string;
};

const CHANCE_TOLERANCE = 0.5;

export function validateWheelChances(configId: WheelConfigId): WheelValidationIssue[] {
  const entry = getWheelConfig(configId);
  const issues: WheelValidationIssue[] = [];

  if (entry.prizes.length === 0) {
    issues.push({ wheelId: configId, message: "No prizes defined" });
    return issues;
  }

  if (!entry.prizes.some((row) => row.chance > 0)) {
    issues.push({
      wheelId: configId,
      message: "Need at least one prize with chance > 0",
    });
  }

  const sum = entry.prizes.reduce((s, row) => s + row.chance, 0);
  if (Math.abs(sum - 100) > CHANCE_TOLERANCE) {
    issues.push({
      wheelId: configId,
      message: `Land chances sum to ${sum.toFixed(1)}% (expected ~100%). All rows count, including 0%.`,
    });
  }

  return issues;
}

export function validateAllWheels(): WheelValidationIssue[] {
  return FLOOR_WHEEL_ORDER.flatMap((id) => validateWheelChances(id));
}

export function formatWheelOddsReport(configId: WheelConfigId, instanceId = configId): string {
  const entry = getWheelConfig(configId);
  const slices = getConfiguredWheelSlices(configId, instanceId);
  const rows = getSliceProbabilities(slices, DEFAULT_RESOLVE_CONTEXT);

  const header = `=== ${entry.title} (${configId}) ===`;
  const chanceNote = `slices on wheel: ${entry.prizes.length} · land % sum: ${entry.prizes.reduce((s, p) => s + p.chance, 0)}%`;

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
