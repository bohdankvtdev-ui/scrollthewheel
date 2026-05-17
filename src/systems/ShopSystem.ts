import { PERK_CATALOG } from "../data/perks";
import {
  ADVANCEMENT_CATALOG,
  advancementShopCost,
  pickShopAdvancementIds,
} from "../game/advancements";
import { BALATRO_ECONOMY } from "../game/balatroEconomy";
import { SHOP_PERK_TREE } from "../game/loop";
import { getSpendableChips, grantChipsInRun, shopChipCost, spendChips } from "../game/shop/chipEconomy";
import { countJokers, isJokerSlotFull } from "../game/shop/jokerSlots";
import { getExtraShopOffers } from "../game/advancements/applyAdvancements";
import { getRunMaxSliceCount } from "../game/advancements/sliceCount";
import {
  buyChipForgeUpgrade,
  CHIP_FORGE_CATALOG,
  CHIP_FORGE_ORDER,
  forgeUpgradeCost,
  getForgeLevel,
} from "../game/shop/chipForge";
import { pickShopOfferIds, sellRefundAmount, shopRerollCost } from "../game/shop/offers";
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
    if (PERK_CATALOG[perkId] == null) return { ok: false, reason: "Unknown joker" };

    if (run.perks.includes(perkId)) {
      return { ok: false, reason: "Already owned" };
    }
    if (isJokerSlotFull(run)) {
      return { ok: false, reason: `Joker slots full (${BALATRO_ECONOMY.maxJokerSlots})` };
    }

    for (const req of node.requires) {
      if (!run.perks.includes(req)) {
        return { ok: false, reason: "Buy the required joker first" };
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
      sliceCapacity: getRunMaxSliceCount(advancements),
      pendingWheelRebuild: true,
    };
    return { ok: true, run: rebuildWheelsFromDatabase(withAdv) };
  }

  static sell(run: RunState, perkId: string): ShopBuyResult {
    if (!run.perks.includes(perkId)) return { ok: false, reason: "Not owned" };

    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
    const base = node?.cost ?? 4;
    const refund = sellRefundAmount(shopChipCost(run, base));

    return {
      ok: true,
      run: grantChipsInRun(
        {
          ...run,
          perks: run.perks.filter((id) => id !== perkId),
        },
        refund
      ),
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
    return run.perks
      .map((perkId) => {
        const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
        const catalog = PERK_CATALOG[perkId];
        const base = node?.cost ?? 4;
        return {
          perkId,
          name: catalog?.name ?? perkId,
          description: catalog?.description ?? "",
          icon: catalog?.icon ?? "stars",
          iconFamily: catalog?.iconFamily ?? "MaterialIcons",
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
    const owned = run.perks.includes(node.perkId);
    const locked = node.requires.some((r) => !run.perks.includes(r));
    const catalog = PERK_CATALOG[node.perkId];
    const cost = shopChipCost(run, node.cost);
    const slotsFull = isJokerSlotFull(run) && !owned;

    return {
      ...node,
      cost,
      owned,
      locked: locked || slotsFull,
      canAfford: getSpendableChips(run) >= cost,
      name: catalog?.name ?? node.perkId,
      tagline: catalog?.tagline ?? "",
      description: catalog?.description ?? "",
      icon: catalog?.icon ?? "stars",
      iconFamily: catalog?.iconFamily ?? "MaterialIcons",
    };
  }

  static listNodes(run: RunState) {
    return ShopSystem.listOfferNodes(run, ShopSystem.pickOffers(run));
  }
}

export { countJokers };
