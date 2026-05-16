import { DEBUFF_CATALOG } from "../../data/debuffs";
import { PERK_CATALOG } from "../../data/perks";
import { RELIC_CATALOG } from "../../data/relics";
import { CARD_CATALOG } from "../../data/cards";
import type { IconFamily, SliceDefinition } from "../../schemas";
import { getRegistryIcon, type IconSpec } from "./iconRegistry";

export type ResolvedIcon = IconSpec & { source: "registry" | "catalog" | "slice" };

function fromRegistry(type: "perk" | "card" | "debuff" | "relic", id: string): IconSpec | undefined {
  return getRegistryIcon(type, id);
}

/** Perk / chip / debuff / relic icon — registry wins over catalog fields. */
export function resolveEntityIcon(
  type: "perk" | "card" | "debuff" | "relic",
  id: string
): ResolvedIcon {
  const reg = fromRegistry(type, id);
  if (reg != null) return { ...reg, source: "registry" };

  const catalogs = {
    perk: PERK_CATALOG,
    card: CARD_CATALOG,
    debuff: DEBUFF_CATALOG,
    relic: RELIC_CATALOG,
  } as const;
  const item = catalogs[type][id];
  if (item != null) {
    return {
      icon: item.icon,
      iconFamily: item.iconFamily as IconFamily,
      source: "catalog",
    };
  }
  return { icon: "help-outline", iconFamily: "MaterialIcons", source: "catalog" };
}

/**
 * Wheel slice icon resolution order:
 * 1. `ICON_REGISTRY.slice[id]`
 * 2. Linked perk / card / debuff / relic from payload
 * 3. `ICON_REGISTRY.sliceKind[kind]`
 * 4. Fields on the slice definition (prizes.ts)
 */
export function resolveSliceIcon(slice: SliceDefinition): ResolvedIcon {
  const byId = getRegistryIcon("slice", slice.id);
  if (byId != null) return { ...byId, source: "registry" };

  const { payload } = slice;
  if (payload.perkId != null) {
    const p = resolveEntityIcon("perk", payload.perkId);
    return { ...p, source: p.source === "registry" ? "registry" : "catalog" };
  }
  if (payload.cardId != null) {
    const c = resolveEntityIcon("card", payload.cardId);
    return { ...c, source: c.source === "registry" ? "registry" : "catalog" };
  }
  if (payload.debuffId != null) {
    const d = resolveEntityIcon("debuff", payload.debuffId);
    return { ...d, source: d.source === "registry" ? "registry" : "catalog" };
  }
  if (payload.relicId != null) {
    const r = resolveEntityIcon("relic", payload.relicId);
    return { ...r, source: r.source === "registry" ? "registry" : "catalog" };
  }

  const byKind = getRegistryIcon("sliceKind", slice.kind);
  if (byKind != null) return { ...byKind, source: "registry" };

  return {
    icon: slice.icon,
    iconFamily: slice.iconFamily,
    source: "slice",
  };
}
