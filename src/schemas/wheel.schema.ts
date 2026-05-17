import type { SpinWheelItem } from "../../wheel/types";
import type { SliceDefinition } from "./slice.schema";

export type WheelRole =
  | "base"
  | "yield"
  | "deck"
  | "risk"
  | "stabilizer"
  | "mini_boss"
  | "jackpot"
  | "power"
  | "preparation"
  | "boss";

export type SliceCount = 6 | 7 | 8 | 9 | 10 | 12;

export type WheelDefinition = {
  id: string;
  /** Key in `game/wheels/database/wheelDatabase.ts` when using the data-driven DB. */
  wheelConfigId?: string;
  role: WheelRole;
  title: string;
  sliceCount: SliceCount;
  slicePoolId: string;
  physicsProfileId: string;
  modifiers?: {
    forceNegativeBias?: number;
    perkOfferChance?: number;
    /** Extra perk weight on this wheel (0–1) */
    perkBoost?: number;
    /** Extra weight on bank_wipe / bank_cut slices (0–1). */
    stakesBoost?: number;
  };
};

export type ResolvedWheel = {
  definition: WheelDefinition;
  slices: SliceDefinition[];
  spinItems: SpinWheelItem[];
};
