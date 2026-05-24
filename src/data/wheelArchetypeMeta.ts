import type { IconFamily } from "../schemas";
import type { WheelArchetype } from "../game/wheels/types";
import { getArchetypeForWheelIndexFromDb } from "../game/wheels/database";

export type WheelArchetypeMeta = {
  archetype: WheelArchetype;
  icon: string;
  iconFamily: IconFamily;
  mapLabel: string;
  tag: string;
  hint: string;
  accent: string;
  pageTint: string;
};

/** RPG-leaning map icons — W1–W2 unchanged. */
export const WHEEL_ARCHETYPE_META: Record<WheelArchetype, WheelArchetypeMeta> = {
  money: {
    archetype: "money",
    icon: "attach-money",
    iconFamily: "MaterialIcons",
    mapLabel: "W1",
    tag: "Money",
    hint: "+$",
    accent: "#FFE94D",
    pageTint: "#1a1428",
  },
  percent: {
    archetype: "percent",
    icon: "percent",
    iconFamily: "MaterialIcons",
    mapLabel: "W2",
    tag: "Percent",
    hint: "% bank",
    accent: "#4ADE80",
    pageTint: "#121f18",
  },
  risk: {
    archetype: "risk",
    icon: "lightning-bolt",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W3",
    tag: "Risk",
    hint: "Swings",
    accent: "#FF6B9D",
    pageTint: "#22121c",
  },
  joker_offer: {
    archetype: "joker_offer",
    icon: "shield-sword",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W4",
    tag: "Perks",
    hint: "Gear",
    accent: "#C4B5FD",
    pageTint: "#18122a",
  },
  drain: {
    archetype: "drain",
    icon: "skull-crossbones",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W5",
    tag: "Drain",
    hint: "−$",
    accent: "#FB7185",
    pageTint: "#241018",
  },
  lucky: {
    archetype: "lucky",
    icon: "treasure-chest",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W6",
    tag: "Lucky",
    hint: "Loot",
    accent: "#FACC15",
    pageTint: "#221c08",
  },
  builder: {
    archetype: "builder",
    icon: "anvil",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W7",
    tag: "Forge",
    hint: "+slice",
    accent: "#22D3EE",
    pageTint: "#101820",
  },
  chaos: {
    archetype: "chaos",
    icon: "ghost",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W8",
    tag: "Chaos",
    hint: "Wild",
    accent: "#F472B6",
    pageTint: "#121a22",
  },
  boss: {
    archetype: "boss",
    icon: "skull",
    iconFamily: "MaterialCommunityIcons",
    mapLabel: "W9",
    tag: "Boss",
    hint: "Final",
    accent: "#FF2D55",
    pageTint: "#1c0810",
  },
};

export function getWheelArchetypeMeta(archetype: WheelArchetype): WheelArchetypeMeta {
  return WHEEL_ARCHETYPE_META[archetype];
}

export function getWheelArchetypeMetaForIndex(wheelIndex: number): WheelArchetypeMeta {
  const archetype = getArchetypeForWheelIndexFromDb(wheelIndex) ?? "money";
  return WHEEL_ARCHETYPE_META[archetype];
}

/** Uppercase stage label — fixed width in header (no "Wheel N" prefix). */
export function wheelStageTagLabel(meta: WheelArchetypeMeta): string {
  return meta.tag.toUpperCase();
}
