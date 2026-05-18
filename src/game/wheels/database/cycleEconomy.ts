import { getCycleAdvancement } from "../../effects/cycleAdvancement";

/**
 * Compound growth per cycle — money wedges scale faster than losses.
 * Advancement tiers (every 3 cycles) add extra money/risk for infinite runs.
 */
export const CYCLE_ECONOMY = {
  /** Flat $ prizes: ~18% compound per cycle cleared */
  moneyGrowthPerCycle: 0.14,
  /** Losses scale closer to gains — wrong calls hurt more over time */
  lossGrowthPerCycle: 0.14,
  /** Bank % gains: base at cycle 1, +0.8% per cycle */
  percentGainBase: 0.035,
  percentGainStep: 0.008,
  /** Round cash to nearest $5 / $10 on big values */
  moneyRoundUnder200: 5,
  moneyRoundOver200: 10,
} as const;

export type CycleEconomy = {
  cycle: number;
  moneyMult: number;
  lossMult: number;
  percentGain: number;
};

export function getCycleEconomy(cycleLevel: number): CycleEconomy {
  const cycle = Math.max(1, cycleLevel);
  const adv = getCycleAdvancement(cycle);
  const baseMoney = Math.pow(1 + CYCLE_ECONOMY.moneyGrowthPerCycle, cycle - 1);
  return {
    cycle,
    moneyMult: baseMoney * adv.moneyMult,
    lossMult: Math.pow(1 + CYCLE_ECONOMY.lossGrowthPerCycle, cycle - 1),
    percentGain:
      CYCLE_ECONOMY.percentGainBase + (cycle - 1) * CYCLE_ECONOMY.percentGainStep,
  };
}

function roundMoney(n: number): number {
  const step = n >= 200 ? CYCLE_ECONOMY.moneyRoundOver200 : CYCLE_ECONOMY.moneyRoundUnder200;
  return Math.max(step, Math.round(n / step) * step);
}

function roundPercent(p: number): number {
  return Math.round(p * 1000) / 1000;
}

/** Re-label slice after payload scaling */
export function formatPrizeLabel(
  kind: string,
  payload: {
    moneyDelta?: number;
    bankPercent?: number;
    wipeBank?: boolean;
    perkId?: string;
    debuffId?: string;
    relicId?: string;
    runEffectId?: string;
    cardId?: string;
  },
  fallback: string
): string {
  if (payload.wipeBank) return "LOSE ALL";
  if (payload.moneyDelta != null && payload.moneyDelta > 0) {
    const n = payload.moneyDelta;
    if (n >= 1000) return `JACKPOT +$${n}`;
    return `+$${n}`;
  }
  if (payload.moneyDelta != null && payload.moneyDelta < 0) {
    return `-$${Math.abs(payload.moneyDelta)}`;
  }
  if (payload.bankPercent != null && payload.bankPercent < 0) {
    return `−${Math.round(Math.abs(payload.bankPercent) * 100)}%`;
  }
  if (payload.bankPercent != null && payload.bankPercent > 0) {
    if (payload.bankPercent >= 1) return "+100%";
    return `+${Math.round(payload.bankPercent * 100)}%`;
  }
  return fallback;
}

export function applyCycleEconomyToPayload(
  payload: Record<string, unknown>,
  kind: string,
  cycle: number
): Record<string, unknown> {
  const econ = getCycleEconomy(cycle);
  const p = { ...payload };

  if (typeof p.moneyDelta === "number") {
    if (p.moneyDelta > 0) {
      p.moneyDelta = roundMoney(p.moneyDelta * econ.moneyMult);
    } else if (p.moneyDelta < 0) {
      p.moneyDelta = -roundMoney(Math.abs(p.moneyDelta) * econ.lossMult);
    }
  }

  if (typeof p.bankPercent === "number" && p.bankPercent > 0 && p.bankPercent < 1) {
    p.bankPercent = roundPercent(p.bankPercent + (cycle - 1) * CYCLE_ECONOMY.percentGainStep);
  }
  if (typeof p.bankPercent === "number" && p.bankPercent < 0 && p.bankPercent > -1) {
    p.bankPercent = -roundPercent(
      Math.abs(p.bankPercent) + (cycle - 1) * CYCLE_ECONOMY.percentGainStep * 0.65
    );
  }

  return p;
}
