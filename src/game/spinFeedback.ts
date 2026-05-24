import type { SliceKind } from "../schemas";
import type { MoneyReveal } from "./moneyReveal";
import { isBankruptMoneyReveal } from "./moneyReveal";

export type SpinFeedbackTier =
  | "neutral"
  | "gain_small"
  | "gain_medium"
  | "gain_large"
  | "gain_jackpot"
  | "loss_small"
  | "loss_medium"
  | "loss_large"
  | "loss_wipe";

export function isGainTier(tier: SpinFeedbackTier): boolean {
  return tier.startsWith("gain_");
}

export function isLossTier(tier: SpinFeedbackTier): boolean {
  return tier.startsWith("loss_");
}

/** Wheel-stage flash length for +$ / −$ results. */
export const WASH_FLASH_MS = 300;

/** @deprecated Use WASH_FLASH_MS */
export const LOSS_WASH_FLASH_MS = WASH_FLASH_MS;

export function isFlashWashTier(tier: SpinFeedbackTier): boolean {
  return isGainTier(tier) || isLossTier(tier);
}

/** Ensures the wash animation runs once per spin even if `RunWheelFeed` remounts. */
let lastPlayedWashEpoch = 0;

export function shouldPlayWashFlash(epoch: number): boolean {
  if (epoch <= 0 || epoch <= lastPlayedWashEpoch) return false;
  lastPlayedWashEpoch = epoch;
  return true;
}

/** @deprecated Use shouldPlayWashFlash */
export function shouldPlayLossWash(epoch: number): boolean {
  return shouldPlayWashFlash(epoch);
}

export function bulbPhaseForFeedback(tier: SpinFeedbackTier): "idle" | "victory" | "jackpot" | "damage" {
  if (tier === "gain_jackpot" || tier === "gain_large") return "jackpot";
  if (isGainTier(tier)) return "victory";
  if (isLossTier(tier)) return "damage";
  return "idle";
}

export function spinFeedbackDurationMs(tier: SpinFeedbackTier): number {
  switch (tier) {
    case "gain_jackpot":
      return 3400;
    case "gain_large":
      return 2800;
    case "gain_medium":
      return 2200;
    case "gain_small":
      return 1600;
    case "loss_wipe":
      return 1200;
    case "loss_large":
      return 1000;
    case "loss_medium":
      return 850;
    case "loss_small":
      return 700;
    default:
      return 400;
  }
}

/** Minimal bright washes on the run page background (#1a1428). */
export type SpinFeedbackVisual = {
  wash: string;
};

/** How strong the 300ms wheel-stage wash is per tier. */
export type WashFlashIntensity = {
  peak: number;
  overlay: number;
};

export function washFlashIntensity(tier: SpinFeedbackTier): WashFlashIntensity {
  switch (tier) {
    case "gain_jackpot":
    case "loss_wipe":
      return { peak: 1, overlay: 0.5 };
    case "gain_large":
    case "loss_large":
      return { peak: 0.8, overlay: 0.38 };
    case "gain_medium":
    case "loss_medium":
      return { peak: 0.55, overlay: 0.28 };
    case "gain_small":
    case "loss_small":
      return { peak: 0.3, overlay: 0.18 };
    default:
      return { peak: 0.22, overlay: 0.14 };
  }
}

export function feedbackVisual(tier: SpinFeedbackTier): SpinFeedbackVisual | null {
  switch (tier) {
    case "gain_jackpot":
      return { wash: "#FFF0B8" };
    case "gain_large":
    case "gain_medium":
    case "gain_small":
      return { wash: "#B8FFF5" };
    case "loss_wipe":
    case "loss_large":
    case "loss_medium":
    case "loss_small":
      return { wash: "#FF3B4D" };
    default:
      return { wash: "#E8E4FF" };
  }
}

export function resolveSpinFeedback(input: {
  moneyReveal?: MoneyReveal | null;
  sliceKind?: SliceKind | string | null;
  shieldBlocked?: boolean;
}): SpinFeedbackTier {
  if (input.shieldBlocked) return "neutral";

  const reveal = input.moneyReveal;
  const kind = input.sliceKind ?? null;

  if (reveal != null) {
    const { before, delta } = reveal;
    if (delta < 0) {
      if (isBankruptMoneyReveal(reveal) || kind === "bank_wipe") return "loss_wipe";
      const abs = Math.abs(delta);
      const ratio = before > 0 ? abs / before : 1;
      if (abs >= 200 || ratio >= 0.45) return "loss_large";
      if (abs >= 60 || ratio >= 0.2) return "loss_medium";
      return "loss_small";
    }
    if (delta > 0) {
      if (delta >= 500) return "gain_jackpot";
      if (delta >= 150) return "gain_large";
      if (delta >= 45) return "gain_medium";
      return "gain_small";
    }
  }

  if (kind === "bank_wipe") return "loss_wipe";
  if (kind === "money_loss" || kind === "bank_cut") return "loss_medium";
  if (kind === "money") return "gain_small";
  if (kind === "perk" || kind === "relic_offer") return "gain_small";

  return "neutral";
}
