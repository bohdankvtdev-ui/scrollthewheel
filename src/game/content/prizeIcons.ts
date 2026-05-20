import type { IconFamily } from "../../schemas";
import type { PrizeDef } from "../wheels/database/types";
import { resolveEntityIcon } from "./resolveIcon";
import { isMoneyWheelInstanceId, wheelConfigIdFromInstanceId } from "./wheelInstanceId";

export type PrizeIcon = { icon: string; iconFamily: IconFamily };

export const MONEY_WHEEL_CASH_ICON: PrizeIcon = {
  icon: "attach-money",
  iconFamily: "MaterialIcons",
};

export const MONEY_WHEEL_LOSS_ICON: PrizeIcon = {
  icon: "money-off",
  iconFamily: "MaterialIcons",
};

/** Distinct cash icons per +$ tier on non–money wheels. */
const MONEY_GAIN_BY_AMOUNT: readonly PrizeIcon[] = [
  { icon: "attach-money", iconFamily: "MaterialIcons" },
  { icon: "payments", iconFamily: "MaterialIcons" },
  { icon: "monetization-on", iconFamily: "MaterialIcons" },
  { icon: "savings", iconFamily: "MaterialIcons" },
  { icon: "account-balance-wallet", iconFamily: "MaterialIcons" },
  { icon: "paid", iconFamily: "MaterialIcons" },
  { icon: "local-atm", iconFamily: "MaterialIcons" },
  { icon: "cash", iconFamily: "MaterialCommunityIcons" },
  { icon: "cash-multiple", iconFamily: "MaterialCommunityIcons" },
  { icon: "wallet", iconFamily: "MaterialCommunityIcons" },
  { icon: "bank", iconFamily: "MaterialCommunityIcons" },
  { icon: "cash-plus", iconFamily: "MaterialCommunityIcons" },
  { icon: "hand-coin", iconFamily: "MaterialCommunityIcons" },
  { icon: "gold", iconFamily: "MaterialCommunityIcons" },
  { icon: "treasure-chest", iconFamily: "MaterialCommunityIcons" },
  { icon: "diamond-stone", iconFamily: "MaterialCommunityIcons" },
  { icon: "star-four-points", iconFamily: "MaterialCommunityIcons" },
];

/** Distinct icons per −$ tier. */
const MONEY_LOSS_BY_AMOUNT: readonly PrizeIcon[] = [
  { icon: "money-off", iconFamily: "MaterialIcons" },
  { icon: "remove-circle", iconFamily: "MaterialIcons" },
  { icon: "do-not-disturb-on", iconFamily: "MaterialIcons" },
  { icon: "trending-down", iconFamily: "MaterialIcons" },
  { icon: "cash-minus", iconFamily: "MaterialCommunityIcons" },
  { icon: "minus-circle", iconFamily: "MaterialCommunityIcons" },
  { icon: "arrow-down-bold", iconFamily: "MaterialCommunityIcons" },
  { icon: "bank-minus", iconFamily: "MaterialCommunityIcons" },
  { icon: "alert-circle", iconFamily: "MaterialCommunityIcons" },
  { icon: "close-circle", iconFamily: "MaterialCommunityIcons" },
];

const BANK_GAIN_ICONS: readonly PrizeIcon[] = [
  { icon: "percent", iconFamily: "MaterialIcons" },
  { icon: "trending-up", iconFamily: "MaterialIcons" },
  { icon: "add-chart", iconFamily: "MaterialIcons" },
  { icon: "show-chart", iconFamily: "MaterialIcons" },
];

const BANK_LOSS_ICONS: readonly PrizeIcon[] = [
  { icon: "percent", iconFamily: "MaterialIcons" },
  { icon: "trending-down", iconFamily: "MaterialIcons" },
  { icon: "remove-chart", iconFamily: "MaterialIcons" },
  { icon: "waterfall-chart", iconFamily: "MaterialIcons" },
];

function tierIndex(amount: number, poolLen: number): number {
  const abs = Math.abs(Math.round(amount));
  return abs % poolLen;
}

function moneyGainIcon(amount: number): PrizeIcon {
  const idx = tierIndex(amount, MONEY_GAIN_BY_AMOUNT.length);
  return MONEY_GAIN_BY_AMOUNT[idx]!;
}

function moneyLossIcon(amount: number): PrizeIcon {
  const idx = tierIndex(amount, MONEY_LOSS_BY_AMOUNT.length);
  return MONEY_LOSS_BY_AMOUNT[idx]!;
}

function bankCutIcon(percent: number): PrizeIcon {
  const pool = percent >= 0 ? BANK_GAIN_ICONS : BANK_LOSS_ICONS;
  const idx = tierIndex(Math.round(Math.abs(percent) * 100), pool.length);
  return pool[idx]!;
}

/** Stable icon per prize id — overrides generic catalog duplicates on the wheel. */
const PRIZE_ID_ICON_OVERRIDES: Partial<Record<string, PrizeIcon>> = {
  bank_wipe: { icon: "account-balance-wallet", iconFamily: "MaterialIcons" },
  bank_double: { icon: "trending-up", iconFamily: "MaterialIcons" },
  neutral_nothing: { icon: "close", iconFamily: "MaterialIcons" },
  boss_ghost: { icon: "ghost", iconFamily: "MaterialCommunityIcons" },
};

/**
 * Resolve the icon shown on a wheel slice / prize row.
 * Linked entities use the central registry; cash/% tiers get distinct glyphs.
 */
export type ResolvePrizeIconOptions = {
  /** Instance id (`wheel_1`, `wheel_1_f2`, …) — used for wheel-specific rules. */
  wheelId?: string;
};

export function resolvePrizeIcon(
  prizeId: string,
  template: Pick<PrizeDef, "kind" | "icon" | "iconFamily" | "payload">,
  options?: ResolvePrizeIconOptions
): PrizeIcon {
  const payload = template.payload ?? {};
  const configId =
    options?.wheelId != null ? wheelConfigIdFromInstanceId(options.wheelId) : "";

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
    if (configId === "wheel_1") return MONEY_WHEEL_CASH_ICON;
    if (configId === "wheel_3") return MONEY_WHEEL_CASH_ICON;
    return moneyGainIcon(payload.moneyDelta);
  }
  if (template.kind === "money_loss" && typeof payload.moneyDelta === "number") {
    if (configId === "wheel_1" || configId === "wheel_3") return MONEY_WHEEL_LOSS_ICON;
    return moneyLossIcon(payload.moneyDelta);
  }
  if (template.kind === "bank_cut" && typeof payload.bankPercent === "number") {
    return bankCutIcon(payload.bankPercent);
  }
  if (template.kind === "bank_wipe") {
    return { icon: "account-balance-wallet", iconFamily: "MaterialIcons" };
  }

  return { icon: template.icon, iconFamily: template.iconFamily };
}

/** @internal test helper */
export function __moneyGainIconForTest(amount: number): PrizeIcon {
  return moneyGainIcon(amount);
}
