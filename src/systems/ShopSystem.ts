import { PERK_CATALOG } from "../data/perks";
import { resolveEntityIcon } from "../game/content/resolveIcon";
import { getPerkDetailLines, getPerkDisplay } from "../game/perks/perkDisplay";
import {
  ADVANCEMENT_CATALOG,
  advancementShopCost,
  pickShopAdvancementIds,
} from "../game/advancements";
import { BALATRO_ECONOMY } from "../game/balatroEconomy";
import { SHOP_PERK_TREE } from "../game/loop";
import { getSpendableChips, grantChipsInRun, shopChipCost, spendChips } from "../game/shop/chipEconomy";
import { countJokers, isJokerSlotFull } from "../game/shop/jokerSlots";
import {
  canAddPerkCopy,
  getLoadoutStacks,
  perkHiddenFromShop,
  removeOnePerkCopy,
} from "../game/perks/perkStacks";
import { meetsShopPerkRequirement } from "../game/shields/shieldRules";
import { getExtraShopOffers } from "../game/advancements/applyAdvancements";
import { getRunMaxSliceCount } from "../game/advancements/sliceCount";
import {
  buyChipForgeUpgrade,
  CHIP_FORGE_CATALOG,
  CHIP_FORGE_ORDER,
  forgeUpgradeCost,
  getForgeLevel,
} from "../game/shop/chipForge";
import {
  buyConsumable as purchaseConsumable,
  consumableCost,
  CONSUMABLE_CATALOG,
  type ConsumableId,
} from "../game/shop/consumables";
import { buildShopPerkCatalog, perkShopLockReason, type ShopPerkCatalogEntry } from "../game/shop/perkCatalog";
import { pickShopOfferIds, sellRefundAmount, shopRerollCost } from "../game/shop/offers";

export type { ShopPerkCatalogEntry };
import type { RunState } from "../schemas";
import { applyPerkAcquisition } from "./PerkSystem";
import { rebuildWheelsFromDatabase } from "./WheelSystem";

export type ShopBuyResult = { ok: true; run: RunState } | { ok: false; reason: string };

export class ShopSystem {
  static pickOffers(run: RunState, rerollSalt = 0): string[] {
    const extra = getExtraShopOffers(run.advancements);
    return pickShopOfferIds(run, BALATRO_ECONOMY.shopOfferCount + extra, rerollSalt);
  }

  static pickAdvancementOffers(run: RunState, rerollSalt = 0): string[] {
    const extra = getExtraShopOffers(run.advancements);
    return pickShopAdvancementIds(
      run,
      BALATRO_ECONOMY.advancementOfferCount + extra,
      rerollSalt
    );
  }

  static canBuy(run: RunState, perkId: string): ShopBuyResult {
    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
    if (node == null) return { ok: false, reason: "Not in shop" };
    if (PERK_CATALOG[perkId] == null) return { ok: false, reason: "Unknown perk" };

    if (!canAddPerkCopy(run, perkId)) {
      if (perkHiddenFromShop(run, perkId)) {
        return { ok: false, reason: "Already owned" };
      }
      return { ok: false, reason: "Max stacks reached" };
    }
    const curseCleanseOnly =
      perkId === "curse_break" && run.debuffs.length > 0 && isJokerSlotFull(run);
    if (isJokerSlotFull(run) && !curseCleanseOnly) {
      return { ok: false, reason: `Perk slots full (${BALATRO_ECONOMY.maxJokerSlots})` };
    }

    for (const req of node.requires) {
      if (!meetsShopPerkRequirement(run, req)) {
        return { ok: false, reason: "Buy the required perk first" };
      }
    }

    const cost = shopChipCost(run, node.cost);
    if (getSpendableChips(run) < cost) {
      return { ok: false, reason: "Not enough chips" };
    }
    return { ok: true, run };
  }

  static canBuyAdvancement(run: RunState, advancementId: string): ShopBuyResult {
    const def = ADVANCEMENT_CATALOG[advancementId];
    if (def == null) return { ok: false, reason: "Unknown upgrade" };
    if ((run.advancements ?? []).includes(advancementId)) {
      return { ok: false, reason: "Already owned" };
    }
    if ((run.advancements ?? []).length >= BALATRO_ECONOMY.maxAdvancements) {
      return { ok: false, reason: `Advancement slots full (${BALATRO_ECONOMY.maxAdvancements})` };
    }
    const cost = advancementShopCost(run, advancementId);
    if (getSpendableChips(run) < cost) {
      return { ok: false, reason: "Not enough chips" };
    }
    return { ok: true, run };
  }

  static buy(run: RunState, perkId: string): ShopBuyResult {
    const check = ShopSystem.canBuy(run, perkId);
    if (!check.ok) return check;
    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId)!;
    const cost = shopChipCost(run, node.cost);
    const afterPay = spendChips(run, cost);
    if (afterPay == null) return { ok: false, reason: "Not enough chips" };
    const withPerk = applyPerkAcquisition(afterPay, perkId);
    return { ok: true, run: withPerk };
  }

  static buyAdvancement(run: RunState, advancementId: string): ShopBuyResult {
    const check = ShopSystem.canBuyAdvancement(run, advancementId);
    if (!check.ok) return check;
    const cost = advancementShopCost(run, advancementId);
    const afterPay = spendChips(run, cost);
    if (afterPay == null) return { ok: false, reason: "Not enough chips" };
    const advancements = [...(afterPay.advancements ?? []), advancementId];
    const withAdv: RunState = {
      ...afterPay,
      advancements,
      sliceCapacity: getRunMaxSliceCount(afterPay.floor, advancements),
      pendingWheelRebuild: true,
    };
    return { ok: true, run: rebuildWheelsFromDatabase(withAdv) };
  }

  static sell(run: RunState, perkId: string): ShopBuyResult {
    const ownedInPerks = run.perks.includes(perkId);
    const ownedShield = (run.shieldPerks ?? []).includes(perkId);
    if (!ownedInPerks && !ownedShield) return { ok: false, reason: "Not owned" };

    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
    const base = node?.cost ?? 4;
    const refund = sellRefundAmount(shopChipCost(run, base));

    let next: RunState;
    if (perkId === "iron_reserve" && ownedShield) {
      const shieldPerks = (run.shieldPerks ?? []).filter((id) => id !== perkId);
      next = {
        ...run,
        shields: Math.max(0, (run.shields ?? 0) - 1),
        shieldPerks,
      };
    } else {
      next = removeOnePerkCopy(run, perkId);
    }

    return { ok: true, run: grantChipsInRun(next, refund) };
  }

  static buyConsumable(run: RunState, id: ConsumableId): ShopBuyResult {
    return purchaseConsumable(run, id);
  }

  static consumableNode(run: RunState, id: ConsumableId = "wedge_eraser") {
    const def = CONSUMABLE_CATALOG[id];
    const owned = run.inventory?.wedgeEraser ?? 0;
    const cost = consumableCost(run, id);
    return {
      id,
      name: def.name,
      description: def.line,
      icon: def.icon,
      owned,
      maxStack: def.maxStack,
      cost,
      canAfford: owned < def.maxStack && getSpendableChips(run) >= cost,
    };
  }

  static buyForge(run: RunState, forgeId: string): ShopBuyResult {
    const result = buyChipForgeUpgrade(run, forgeId as keyof typeof CHIP_FORGE_CATALOG);
    if (!result.ok) return result;
    return { ok: true, run: result.run };
  }

  static listForgeNodes(run: RunState) {
    return CHIP_FORGE_ORDER.map((id) => {
      const def = CHIP_FORGE_CATALOG[id];
      const level = getForgeLevel(run, id);
      const maxed = level >= def.maxLevel;
      const cost = forgeUpgradeCost(run, id);
      return {
        forgeId: id,
        name: def.name,
        description: def.line,
        icon: def.icon,
        iconFamily: def.iconFamily,
        level,
        maxed,
        cost,
        canAfford: !maxed && getSpendableChips(run) >= cost,
      };
    });
  }

  static reroll(run: RunState, rerollsThisVisit: number): ShopBuyResult {
    const cost = shopRerollCost(run, rerollsThisVisit);
    const afterPay = spendChips(run, cost);
    if (afterPay == null) return { ok: false, reason: "Not enough chips" };
    return { ok: true, run: afterPay };
  }

  static listOfferNodes(run: RunState, offerIds: string[]) {
    return offerIds
      .map((perkId) => {
        const matches = SHOP_PERK_TREE.filter((n) => n.perkId === perkId);
        const node =
          matches.length <= 1 ? matches[0] : ShopSystem.pickShopNodeForOffer(run, matches);
        return node != null ? ShopSystem.nodeView(run, node) : null;
      })
      .filter((n): n is NonNullable<typeof n> => n != null);
  }

  static listAdvancementNodes(run: RunState, offerIds: string[]) {
    return offerIds
      .map((id) => {
        const def = ADVANCEMENT_CATALOG[id];
        if (def == null) return null;
        const owned = (run.advancements ?? []).includes(id);
        const slotsFull =
          (run.advancements ?? []).length >= BALATRO_ECONOMY.maxAdvancements && !owned;
        const cost = advancementShopCost(run, id);
        return {
          advancementId: id,
          name: def.name,
          description: def.line,
          tagline: `Tier ${def.tier} upgrade`,
          icon: def.icon,
          iconFamily: "MaterialIcons" as const,
          cost,
          owned,
          locked: slotsFull,
          canAfford: getSpendableChips(run) >= cost,
          tier: def.tier,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n != null);
  }

  private static pickShopNodeForOffer(
    run: RunState,
    nodes: (typeof SHOP_PERK_TREE)[number][]
  ): (typeof SHOP_PERK_TREE)[number] {
    const sorted = [...nodes].sort((a, b) => a.tier - b.tier || a.cost - b.cost);
    for (const node of sorted) {
      const view = ShopSystem.nodeView(run, node);
      if (!view.owned && !view.locked) return node;
    }
    return sorted[sorted.length - 1]!;
  }

  static listOwnedJokers(run: RunState) {
    return getLoadoutStacks(run)
      .filter((s) => s.kind === "perk")
      .map(({ id: perkId, count }) => {
        const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
        const catalog = PERK_CATALOG[perkId];
        const base = node?.cost ?? 4;
        const resolved = resolveEntityIcon("perk", perkId);
        const detailLines = getPerkDetailLines(perkId);
        const stackLabel = count > 1 ? ` ×${count}` : "";
        return {
          perkId,
          stackCount: count,
          name: (catalog?.name ?? perkId) + stackLabel,
          description: detailLines[0] ?? catalog?.description ?? "",
          icon: resolved.icon,
          iconFamily: resolved.iconFamily,
          sellValue: sellRefundAmount(shopChipCost(run, base)),
        };
      });
  }

  static listOwnedAdvancements(run: RunState) {
    return (run.advancements ?? []).map((id) => {
      const def = ADVANCEMENT_CATALOG[id];
      return {
        advancementId: id,
        name: def?.name ?? id,
        description: def?.line ?? "",
        icon: def?.icon ?? "upgrade",
      };
    });
  }

  private static nodeView(run: RunState, node: (typeof SHOP_PERK_TREE)[number]) {
    const owned = perkHiddenFromShop(run, node.perkId);
    const locked = node.requires.some((r) => !meetsShopPerkRequirement(run, r));
    const catalog = PERK_CATALOG[node.perkId];
    const cost = shopChipCost(run, node.cost);
    const slotsFull = isJokerSlotFull(run) && !owned;
    const resolved = resolveEntityIcon("perk", node.perkId);
    const detailLines = getPerkDetailLines(node.perkId);
    const lockReason = owned ? null : perkShopLockReason(run, node);

    return {
      ...node,
      cost,
      owned,
      locked: locked || slotsFull,
      lockReason,
      canAfford: getSpendableChips(run) >= cost,
      name: catalog?.name ?? node.perkId,
      tagline: catalog?.tagline || getPerkDisplay(node.perkId)?.tagline || "",
      description: detailLines[0] ?? catalog?.description ?? "",
      icon: resolved.icon,
      iconFamily: resolved.iconFamily,
    };
  }

  static listNodes(run: RunState) {
    return ShopSystem.listOfferNodes(run, ShopSystem.pickOffers(run));
  }

  static listPerkCatalog(run: RunState, offerIds: readonly string[]): ShopPerkCatalogEntry[] {
    return buildShopPerkCatalog(run, offerIds);
  }
}

export { countJokers };
