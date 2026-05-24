import type { WheelDefinition } from "../../schemas";
import {
  buildFloorDefinitionsFromDatabase,
  FLOOR_WHEEL_ORDER,
  getArchetypeForWheelIndexFromDb,
  getWheelConfig,
} from "./database";
import type { PrototypeWheelTemplate } from "./types";

/** 9-wheel cycle — scroll spin → … → boss. */
export const FLOOR_PROTOTYPE_WHEELS: PrototypeWheelTemplate[] = [
  {
    id: "w_money",
    archetype: "money",
    title: "Money Wheel",
    role: "yield",
    slicePoolId: "yield",
    physicsProfileId: "default",
  },
  {
    id: "w_percent",
    archetype: "percent",
    title: "Percent Wheel",
    role: "yield",
    slicePoolId: "yield",
    physicsProfileId: "default",
    modifiers: { stakesBoost: 0.08 },
  },
  {
    id: "w_risk",
    archetype: "risk",
    title: "Risk Wheel",
    role: "risk",
    slicePoolId: "risk",
    physicsProfileId: "default",
    modifiers: { forceNegativeBias: 0.1 },
  },
  {
    id: "w_joker",
    archetype: "joker_offer",
    title: "Perk Wheel",
    role: "power",
    slicePoolId: "power",
    physicsProfileId: "default",
    modifiers: { perkBoost: 0.45 },
  },
  {
    id: "w_drain",
    archetype: "drain",
    title: "Drain Wheel",
    role: "mini_boss",
    slicePoolId: "mini_boss",
    physicsProfileId: "boss",
    modifiers: { forceNegativeBias: 0.28, stakesBoost: 0.2 },
  },
  {
    id: "w_lucky",
    archetype: "lucky",
    title: "Lucky Wheel",
    role: "jackpot",
    slicePoolId: "jackpot",
    physicsProfileId: "default",
  },
  {
    id: "w_builder",
    archetype: "builder",
    title: "Builder Wheel",
    role: "deck",
    slicePoolId: "deck",
    physicsProfileId: "default",
  },
  {
    id: "w_chaos",
    archetype: "chaos",
    title: "Chaos Wheel",
    role: "risk",
    slicePoolId: "curse",
    physicsProfileId: "boss",
    modifiers: { forceNegativeBias: 0.22, stakesBoost: 0.15 },
  },
  {
    id: "w_boss",
    archetype: "boss",
    title: "Boss Wheel",
    role: "boss",
    slicePoolId: "boss",
    physicsProfileId: "boss",
    modifiers: { stakesBoost: 0.4, forceNegativeBias: 0.08 },
  },
];

export const FLOOR_WHEEL_COUNT = FLOOR_PROTOTYPE_WHEELS.length;

export function prototypeToWheelDefinitions(floor: number = 1): WheelDefinition[] {
  return buildFloorDefinitionsFromDatabase(floor);
}

export function getArchetypeForWheelIndex(index: number): PrototypeWheelTemplate["archetype"] | null {
  return getArchetypeForWheelIndexFromDb(index);
}

export function getWheelConfigIdForIndex(index: number): string | null {
  return FLOOR_WHEEL_ORDER[index] ?? null;
}

export function getPrototypeMetaForIndex(index: number): PrototypeWheelTemplate | null {
  const configId = FLOOR_WHEEL_ORDER[index];
  if (configId == null) return null;
  const entry = getWheelConfig(configId);
  return {
    id: configId,
    archetype: entry.archetype,
    title: entry.title,
    role: entry.role,
    slicePoolId: "config",
    physicsProfileId: entry.physicsProfileId ?? "default",
    modifiers: entry.modifiers,
  };
}

