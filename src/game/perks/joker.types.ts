import type { IconFamily } from "../../schemas";
import type { PerkTier } from "../gdd";

/** When a joker/perk effect is evaluated. */
export type JokerTrigger =
  | "passive"
  | "onSpin"
  | "onGainMoney"
  | "onLoseMoney"
  | "onBoss"
  | "onFloorEnd";

export type JokerCategory = "economy" | "chips" | "risk" | "defensive" | "wheel" | "meta";

export type JokerStackRule = "unique" | "stack";

export type JokerDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconFamily: IconFamily;
  tier: PerkTier;
  category: JokerCategory;
  trigger: JokerTrigger;
  stackRule: JokerStackRule;
  /** Optional chip bonus when acquired (meta score this run). */
  chipsOnAcquire?: number;
};

export type JokerEvent =
  | { type: "onSpin"; wheelIndex: number; archetype: string | null }
  | { type: "onGainMoney"; amount: number; wheelIndex: number }
  | { type: "onLoseMoney"; amount: number; wheelIndex: number }
  | { type: "onBoss"; wheelIndex: number }
  | { type: "onFloorEnd"; floor: number; cleared: boolean };
