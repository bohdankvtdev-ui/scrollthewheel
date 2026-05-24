import { PERK_CATALOG } from "../../data/perks";
import { resolveEntityIcon } from "../content/resolveIcon";
import { SHOP_PERK_TREE, type ShopPerkNode } from "../loop";
import { getPerkDetailLines, getPerkDisplay } from "../perks/perkDisplay";
import { PERK_FAMILY_COLORS, PERK_FAMILY_LABELS } from "../perks/perkFamilies";
import type { IconFamily, RunState } from "../../schemas";
import { getSpendableChips, shopChipCost } from "./chipEconomy";
import { isJokerSlotFull } from "./jokerSlots";
import { canAddPerkCopy, perkHiddenFromShop } from "../perks/perkStacks";
import { meetsShopPerkRequirement } from "../shields/shieldRules";

export type ShopPerkCatalogEntry = {
  perkId: string;
  tier: number;
  cost: number;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  iconFamily: IconFamily;
  familyLabel: string;
  familyBg: string;
  familyAccent: string;
  owned: boolean;
  inOffers: boolean;
  purchasable: boolean;
  locked: boolean;
  lockReason: string | null;
  canAfford: boolean;
  requires: string[];
};

function uniqueNodes(): ShopPerkNode[] {
  const byId = new Map<string, ShopPerkNode>();
  for (const node of SHOP_PERK_TREE) {
    const prev = byId.get(node.perkId);
    if (prev == null || node.tier < prev.tier) {
      byId.set(node.perkId, node);
    }
  }
  return [...byId.values()].sort((a, b) => a.tier - b.tier || a.cost - b.cost || a.column - b.column);
}

export function perkShopLockReason(run: RunState, node: ShopPerkNode): string | null {
  if (perkHiddenFromShop(run, node.perkId)) return "Owned";
  if (!canAddPerkCopy(run, node.perkId) && run.perks.includes(node.perkId)) {
    return "Max stacks";
  }
  const curseCleanseOnly =
    node.perkId === "curse_break" && run.debuffs.length > 0 && isJokerSlotFull(run);
  if (isJokerSlotFull(run) && !curseCleanseOnly) {
    return "Perk slots full";
  }
  for (const req of node.requires) {
    if (!meetsShopPerkRequirement(run, req)) {
      const reqName = PERK_CATALOG[req]?.name ?? req;
      return `Needs ${reqName}`;
    }
  }
  return null;
}

/** Short label for catalog tiles — never use bare "!". */
export function shortenPerkLockReason(reason: string | null): string | null {
  if (reason == null) return null;
  if (reason === "Perk slots full") return "SLOTS FULL";
  if (reason === "Max stacks") return "MAX STACK";
  if (reason.startsWith("Needs ")) return reason.replace("Needs ", "Need ");
  return reason.toUpperCase();
}

export function buildShopPerkCatalog(
  run: RunState,
  offerIds: readonly string[]
): ShopPerkCatalogEntry[] {
  const offerSet = new Set(offerIds);
  return uniqueNodes()
    .filter((node) => !perkHiddenFromShop(run, node.perkId))
    .map((node) => {
    const catalog = PERK_CATALOG[node.perkId];
    const resolved = resolveEntityIcon("perk", node.perkId);
    const display = getPerkDisplay(node.perkId);
    const detailLines = getPerkDetailLines(node.perkId);
    const family = catalog?.family ?? "odds";
    const familyColors = PERK_FAMILY_COLORS[family];
    const lockReason = perkShopLockReason(run, node);
    const owned = lockReason === "Owned";
    const cost = shopChipCost(run, node.cost);
    const locked = lockReason != null && !owned;
    const purchasable = !owned && lockReason == null;
    const canAfford = getSpendableChips(run) >= cost;

    return {
      perkId: node.perkId,
      tier: node.tier,
      cost,
      name: catalog?.name ?? node.perkId,
      tagline: catalog?.tagline || display?.tagline || "",
      description: detailLines[0] ?? catalog?.description ?? "",
      icon: resolved.icon,
      iconFamily: resolved.iconFamily,
      familyLabel: PERK_FAMILY_LABELS[family],
      familyBg: familyColors.bg,
      familyAccent: familyColors.accent,
      owned,
      inOffers: offerSet.has(node.perkId),
      purchasable,
      locked,
      lockReason: owned ? null : lockReason,
      canAfford,
      requires: node.requires,
    };
  });
}
