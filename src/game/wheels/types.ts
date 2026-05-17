import type { WheelDefinition, WheelRole } from "../../schemas";

/** Design-facing wheel kinds (9-wheel cycle). */
export type WheelArchetype =
  | "money"
  | "percent"
  | "risk"
  | "joker_offer"
  | "drain"
  | "lucky"
  | "builder"
  | "chaos"
  | "boss";

export type PrototypeWheelTemplate = {
  id: string;
  archetype: WheelArchetype;
  title: string;
  role: WheelRole;
  slicePoolId: string;
  physicsProfileId: string;
  modifiers?: WheelDefinition["modifiers"];
};

export type WheelOutcome = {
  deltaMoney: number;
  deltaChips: number;
  perkOffers: string[];
  debuffApplied: string | null;
  relicGranted: string | null;
  label: string;
  sliceId: string;
  sliceKind: string;
};
