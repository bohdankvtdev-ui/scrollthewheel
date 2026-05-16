import { PERK_CATALOG } from "../data/perks";
import { BALATRO_ECONOMY } from "../game/balatroEconomy";
import { RUN_DEFAULTS, SHOP_PERK_TREE } from "../game/loop";
import { countJokers, isJokerSlotFull } from "../game/shop/jokerSlots";
import { pickShopOfferIds, sellRefundAmount, shopRerollCost } from "../game/shop/offers";
import type { RunState } from "../schemas";
import { applyPerkAcquisition } from "./PerkSystem";

export type ShopBuyResult = { ok: true; run: RunState } | { ok: false; reason: string };

function shopCost(run: RunState, base: number): number {
  if (run.perks.includes("coupon_king")) return Math.floor(base * 0.85);
  return base;
}

const SLICE_PERKS = new Set(["extra_slice", "slice_expander"]);

export class ShopSystem {
  static pickOffers(run: RunState, rerollSalt = 0): string[] {
    return pickShopOfferIds(run, BALATRO_ECONOMY.shopOfferCount, rerollSalt);
  }

  static canBuy(run: RunState, perkId: string): ShopBuyResult {
    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
    if (node == null) return { ok: false, reason: "Not in shop" };
    if (PERK_CATALOG[perkId] == null) return { ok: false, reason: "Unknown joker" };

    if (perkId === "extra_slice" || perkId === "slice_expander") {
      if (run.sliceCapacity >= RUN_DEFAULTS.maxSliceCapacity) {
        return { ok: false, reason: "Wheel is full" };
      }
    } else if (run.perks.includes(perkId)) {
      return { ok: false, reason: "Already owned" };
    } else if (isJokerSlotFull(run)) {
      return { ok: false, reason: `Joker slots full (${BALATRO_ECONOMY.maxJokerSlots})` };
    }

    for (const req of node.requires) {
      if (req === "extra_slice") {
        if (run.sliceCapacity < 7) return { ok: false, reason: "Need 7 slices first" };
      } else if (!run.perks.includes(req)) {
        return { ok: false, reason: "Needs prior upgrade" };
      }
    }

    const cost = shopCost(run, node.cost);
    if (run.money < cost) return { ok: false, reason: "Not enough cash" };
    return { ok: true, run };
  }

  static buy(run: RunState, perkId: string): ShopBuyResult {
    const check = ShopSystem.canBuy(run, perkId);
    if (!check.ok) return check;
    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId)!;
    const cost = shopCost(run, node.cost);
    const afterPay = { ...run, money: run.money - cost };
    const withPerk = applyPerkAcquisition(afterPay, perkId);
    return { ok: true, run: withPerk };
  }

  static sell(run: RunState, perkId: string): ShopBuyResult {
    if (!run.perks.includes(perkId)) return { ok: false, reason: "Not owned" };
    if (SLICE_PERKS.has(perkId)) return { ok: false, reason: "Can't sell slice upgrades" };

    const node = SHOP_PERK_TREE.find((n) => n.perkId === perkId);
    const base = node?.cost ?? 4;
    const refund = sellRefundAmount(shopCost(run, base));

    return {
      ok: true,
      run: {
        ...run,
        money: run.money + refund,
        perks: run.perks.filter((id) => id !== perkId),
      },
    };
  }

  static reroll(run: RunState, rerollsThisVisit: number): ShopBuyResult {
    const cost = shopRerollCost(run, rerollsThisVisit);
    if (run.money < cost) return { ok: false, reason: "Not enough cash" };
    return { ok: true, run: { ...run, money: run.money - cost } };
  }

  static listOfferNodes(run: RunState, offerIds: string[]) {
    return offerIds.map((perkId) => {
      const matches = SHOP_PERK_TREE.filter((n) => n.perkId === perkId);
      const node =
        matches.length <= 1
          ? matches[0]
          : ShopSystem.pickShopNodeForOffer(run, matches);
      return node != null ? ShopSystem.nodeView(run, node) : null;
    }).filter((n): n is NonNullable<typeof n> => n != null);
  }

  /** One tree row per perk id — prefer cheapest available tier. */
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
      .filter((id) => !SLICE_PERKS.has(id))
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
          sellValue: sellRefundAmount(shopCost(run, base)),
        };
      });
  }

  private static nodeView(run: RunState, node: (typeof SHOP_PERK_TREE)[number]) {
    const owned =
      node.perkId === "extra_slice" || node.perkId === "slice_expander"
        ? run.sliceCapacity >= RUN_DEFAULTS.maxSliceCapacity
        : run.perks.includes(node.perkId);
    const locked = node.requires.some((r) => {
      if (r === "extra_slice") return run.sliceCapacity < 7;
      return !run.perks.includes(r);
    });
    const catalog = PERK_CATALOG[node.perkId];
    const cost = shopCost(run, node.cost);
    const slotsFull = isJokerSlotFull(run) && !SLICE_PERKS.has(node.perkId) && !owned;

    return {
      ...node,
      cost,
      owned,
      locked: locked || slotsFull,
      canAfford: run.money >= cost,
      name: catalog?.name ?? node.perkId,
      description: catalog?.description ?? "",
      icon: catalog?.icon ?? "stars",
      iconFamily: catalog?.iconFamily ?? "MaterialIcons",
    };
  }

  /** @deprecated Use listOfferNodes with pickOffers */
  static listNodes(run: RunState) {
    return ShopSystem.listOfferNodes(run, ShopSystem.pickOffers(run));
  }
}

export { countJokers };
