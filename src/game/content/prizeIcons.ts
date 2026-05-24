import type { IconFamily } from "../../schemas";
import type { PrizeDef } from "../wheels/database/types";
import { resolveEntityIcon } from "./resolveIcon";

export type PrizeIcon = { icon: string; iconFamily: IconFamily };

/** All +$ wedges — one dollar glyph everywhere (money, chaos, boss, …). */
export const MONEY_WHEEL_CASH_ICON: PrizeIcon = {
  icon: "attach-money",
  iconFamily: "MaterialIcons",
};

/** All −$ wedges — crossed dollar (money-off) everywhere. */
export const MONEY_WHEEL_LOSS_ICON: PrizeIcon = {
  icon: "money-off",
  iconFamily: "MaterialIcons",
};

/** Stable icon per prize id — overrides generic catalog duplicates on the wheel. */
const PRIZE_ID_ICON_OVERRIDES: Partial<Record<string, PrizeIcon>> = {
  bank_wipe: { icon: "account-balance-wallet", iconFamily: "MaterialIcons" },
  bank_double: { icon: "trending-up", iconFamily: "MaterialIcons" },
  neutral_nothing: { icon: "close", iconFamily: "MaterialIcons" },
  boss_ghost: { icon: "ghost", iconFamily: "MaterialCommunityIcons" },
};

/**
 * Resolve the icon shown on a wheel slice / prize row.
 * Linked entities use the central registry; flat cash uses dollar / crossed-dollar only.
 */
export type ResolvePrizeIconOptions = {
  /** Instance id (`wheel_1`, `wheel_1_f2`, …) — reserved for wheel-specific rules. */
  wheelId?: string;
};

export function resolvePrizeIcon(
  prizeId: string,
  template: Pick<PrizeDef, "kind" | "icon" | "iconFamily" | "payload">,
  _options?: ResolvePrizeIconOptions
): PrizeIcon {
  const payload = template.payload ?? {};

  if (typeof payload.perkId === "string") {
    const p = resolveEntityIcon("perk", payload.perkId);
    return { icon: p.icon, iconFamily: p.iconFamily };
  }
  if (typeof payload.relicId === "string") {
    const r = resolveEntityIcon("relic", payload.relicId);
    return { icon: r.icon, iconFamily: r.iconFamily };
  }
  if (typeof payload.debuffId === "string") {
    const d = resolveEntityIcon("debuff", payload.debuffId);
    return { icon: d.icon, iconFamily: d.iconFamily };
  }
  if (typeof payload.cardId === "string") {
    const c = resolveEntityIcon("card", payload.cardId);
    return { icon: c.icon, iconFamily: c.iconFamily };
  }

  const override = PRIZE_ID_ICON_OVERRIDES[prizeId];
  if (override != null) return override;

  if (template.kind === "money" && typeof payload.moneyDelta === "number") {
    return MONEY_WHEEL_CASH_ICON;
  }
  if (template.kind === "money_loss" && typeof payload.moneyDelta === "number") {
    return MONEY_WHEEL_LOSS_ICON;
  }
  if (template.kind === "bank_cut" && typeof payload.bankPercent === "number") {
    const pct = payload.bankPercent;
    return {
      icon: "percent",
      iconFamily: "MaterialIcons",
    };
  }
  if (template.kind === "bank_wipe") {
    return { icon: "account-balance-wallet", iconFamily: "MaterialIcons" };
  }

  return { icon: template.icon, iconFamily: template.iconFamily };
}

/** @internal test helper */
export function __moneyGainIconForTest(amount: number): PrizeIcon {
  void amount;
  return MONEY_WHEEL_CASH_ICON;
}
