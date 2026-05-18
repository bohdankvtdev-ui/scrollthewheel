import type { IconFamily } from "../schemas";
import type { WheelArchetype } from "../game/wheels/types";
import { getArchetypeForWheelIndexFromDb } from "../game/wheels/database";

export type WheelArchetypeMeta = {
  archetype: WheelArchetype;
  icon: string;
  iconFamily: IconFamily;
  /** Short label on the wheel map (W1, W2, …). */
  mapLabel: string;
  tag: string;
  hint: string;
  accent: string;
  pageTint: string;
};

/** Icons and colors keyed by wheel archetype — not gameplay `role`. */
export const WHEEL_ARCHETYPE_META: Record<WheelArchetype, WheelArchetypeMeta> = {
  money: {
    archetype: "money",
    icon: "attach-money",
    iconFamily: "MaterialIcons",
    mapLabel: "W1",
    tag: "Money",
    hint: "Flat cash wedges",
    accent: "#FFE94D",
    pageTint: "#1a1428",
  },
  percent: {
    archetype: "percent",
    icon: "percent",
    iconFamily: "MaterialIcons",
    mapLabel: "W2",
    tag: "Percent",
    hint: "% of your bank",
    accent: "#4ADE80",
    pageTint: "#121f18",
  },
  risk: {
    archetype: "risk",
    icon: "bolt",
    iconFamily: "MaterialIcons",
    mapLabel: "W3",
    tag: "Risk",
    hint: "Big swings",
    accent: "#FF6B9D",
    pageTint: "#22121c",
  },
  joker_offer: {
    archetype: "joker_offer",
    icon: "auto-awesome",
    iconFamily: "MaterialIcons",
    mapLabel: "W4",
    tag: "Perks",
    hint: "Perk offers",
    accent: "#C4B5FD",
    pageTint: "#18122a",
  },
  drain: {
    archetype: "drain",
    icon: "trending-down",
    iconFamily: "MaterialIcons",
    mapLabel: "W5",
    tag: "Drain",
    hint: "Cuts your bank",
    accent: "#FB7185",
    pageTint: "#241018",
  },
  lucky: {
    archetype: "lucky",
    icon: "emoji-events",
    iconFamily: "MaterialIcons",
    mapLabel: "W6",
    tag: "Lucky",
    hint: "Jackpot slices",
    accent: "#FACC15",
    pageTint: "#221c08",
  },
  builder: {
    archetype: "builder",
    icon: "build",
    iconFamily: "MaterialIcons",
    mapLabel: "W7",
    tag: "Builder",
    hint: "+1 wedge on all wheels",
    accent: "#22D3EE",
    pageTint: "#101820",
  },
  chaos: {
    archetype: "chaos",
    icon: "shuffle",
    iconFamily: "MaterialIcons",
    mapLabel: "W8",
    tag: "Chaos",
    hint: "Wild mix",
    accent: "#F472B6",
    pageTint: "#121a22",
  },
  boss: {
    archetype: "boss",
    icon: "gavel",
    iconFamily: "MaterialIcons",
    mapLabel: "W9",
    tag: "Final",
    hint: "Flat $ pain",
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
