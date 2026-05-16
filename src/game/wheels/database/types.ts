import type { WheelArchetype } from "../types";
import type { IconFamily, SliceKind, SlicePayload, SliceWeightTag } from "../../../schemas";

/** Prize template — no weight/id; those come from the wheel row. */
export type PrizeDef = {
  kind: SliceKind;
  label: string;
  icon: string;
  iconFamily: IconFamily;
  weightTags?: SliceWeightTag[];
  payload: SlicePayload;
  presentation?: { colorIndex?: number; rarity?: "common" | "rare" };
};

import type { PrizeCatalogId } from "./prizeCatalog";

/**
 * One wedge on the wheel.
 * - Every row becomes a visible slice on that wheel (unique layout per wheel).
 * - `chance` is land % on spin (all rows on a wheel should sum to 100).
 * - `chance: 0` = shown on wheel but never wins (good for tuning / tests).
 */
export type WheelPrizeSlot = {
  prize: PrizeCatalogId | (string & {});
  chance: number;
};

export type WheelConfigEntry = {
  title: string;
  archetype: WheelArchetype;
  role: import("../../../schemas").WheelRole;
  physicsProfileId?: string;
  modifiers?: {
    forceNegativeBias?: number;
    perkBoost?: number;
    stakesBoost?: number;
  };
  /** Unique prizes + land chances for this wheel only. */
  prizes: WheelPrizeSlot[];
};

export type WheelConfigId = string;
