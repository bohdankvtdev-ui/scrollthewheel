/**
 * Wheel metadata — slice layouts built at runtime from pools (`wheelPrizeBuilder.ts`).
 * npm run validate:wheels   npm run preview:wheels
 */

import type { WheelConfigEntry, WheelConfigId } from "./types";

export const WHEEL_DATABASE_REVISION = 28;

export const FLOOR_WHEEL_ORDER = [
  "wheel_1",
  "wheel_2",
  "wheel_3",
  "wheel_4",
  "wheel_5",
  "wheel_6",
  "wheel_7",
  "wheel_8",
  "wheel_9",
] as const satisfies readonly WheelConfigId[];

export type FloorWheelOrderId = (typeof FLOOR_WHEEL_ORDER)[number];

export const WHEEL_DATABASE: Record<FloorWheelOrderId, WheelConfigEntry> = {
  wheel_1: {
    title: "Money Wheel",
    archetype: "money",
    role: "yield",
    physicsProfileId: "default",
  },

  wheel_2: {
    title: "Percent Wheel",
    archetype: "percent",
    role: "yield",
    physicsProfileId: "default",
    modifiers: { stakesBoost: 0.08 },
  },

  wheel_3: {
    title: "Risk Wheel",
    archetype: "risk",
    role: "risk",
    modifiers: { forceNegativeBias: 0.12 },
  },

  wheel_4: {
    title: "Perk Wheel",
    archetype: "joker_offer",
    role: "power",
    modifiers: { perkBoost: 0.45 },
  },

  wheel_5: {
    title: "Drain Wheel",
    archetype: "drain",
    role: "mini_boss",
    physicsProfileId: "boss",
    modifiers: { forceNegativeBias: 0.32, stakesBoost: 0.24 },
  },

  wheel_6: {
    title: "Lucky Wheel",
    archetype: "lucky",
    role: "jackpot",
  },

  wheel_7: {
    title: "Builder Wheel",
    archetype: "builder",
    role: "deck",
  },

  wheel_8: {
    title: "Chaos Wheel",
    archetype: "chaos",
    role: "risk",
    physicsProfileId: "boss",
    modifiers: { forceNegativeBias: 0.26, stakesBoost: 0.18 },
  },

  wheel_9: {
    title: "Final Wheel",
    archetype: "boss",
    role: "boss",
    physicsProfileId: "boss",
    modifiers: { stakesBoost: 0.72, forceNegativeBias: 0.38 },
  },
};
