import type { RunState, SliceDefinition, SpinEvent } from "../../schemas";
import type { ResolvedWheel } from "../../schemas";
import type { PoolPick } from "../wheels/database/wheelPrizePools";
import { FLOOR_WHEEL_ORDER } from "../wheels/database/wheelDatabase";

function applyBossMoneyLoss(run: RunState, loss: number): RunState {
  if (loss <= 0) return run;
  return { ...run, money: Math.max(0, run.money - loss) };
}

/** Boss / final wheel land % — heavy weight on first (harshest) slices. */
export const BOSS_LAND_SHAPE = [30, 24, 18, 14, 9, 5] as const;

/** Final wheel — even harsher odds on the worst wedges. */
export const FINAL_LAND_SHAPE = [38, 28, 18, 10, 4, 2] as const;

const BOSS_WHEEL_INDEX = 8;

/** How the prior 8 wheels should skew the boss pool (weights, not slice count). */
export type BossCycleAudit = {
  spins: number;
  /** 0 = struggling, 1 = ran hot */
  heat: number;
  /** Extra weight on flat −$ picks */
  flatLossBias: number;
  /** Extra weight on % bank cuts & wipe */
  stakesBias: number;
  /** Extra weight on perk tax / overhead */
  perkTaxBias: number;
  /** Dampen small boss payouts when player ran hot */
  payoutDampen: number;
};

function sliceFromHistory(
  wheels: ResolvedWheel[],
  event: SpinEvent
): SliceDefinition | undefined {
  const wheel = wheels[event.wheelIndex];
  return wheel?.slices.find((s) => s.id === event.sliceId);
}

function isPositiveMoneySlice(slice: SliceDefinition): boolean {
  if (slice.kind === "money") return (slice.payload.moneyDelta ?? 0) > 0;
  if (slice.kind === "bank_cut") {
    const pct = slice.payload.bankPercent;
    return typeof pct === "number" && pct > 0;
  }
  return false;
}

function isNegativeMoneySlice(slice: SliceDefinition): boolean {
  if (slice.kind === "money_loss") return true;
  if (slice.kind === "bank_wipe" || slice.payload.wipeBank) return true;
  if (slice.kind === "bank_cut") {
    const pct = slice.payload.bankPercent;
    return typeof pct === "number" && pct < 0;
  }
  if (slice.kind === "money") return (slice.payload.moneyDelta ?? 0) < 0;
  return false;
}

/**
 * Summarize wheels 1–8 on the current cycle for boss tailoring.
 * Uses landed slice kinds from `run.history` + current wheel layouts.
 */
export function summarizeCycleBeforeBoss(
  run: RunState,
  wheels: ResolvedWheel[]
): BossCycleAudit {
  const floor = run.floor;
  const events = run.history.filter(
    (h) => h.floor === floor && h.wheelIndex >= 0 && h.wheelIndex < BOSS_WHEEL_INDEX
  );

  let positiveHits = 0;
  let negativeHits = 0;
  let luckySpins = 0;
  let drainSpins = 0;
  let chaosSpins = 0;
  let perkWins = 0;
  let builderSpins = 0;
  let bigCashHits = 0;

  for (const ev of events) {
    const configId = FLOOR_WHEEL_ORDER[ev.wheelIndex];
    if (configId === "wheel_6") luckySpins += 1;
    if (configId === "wheel_5") drainSpins += 1;
    if (configId === "wheel_8") chaosSpins += 1;
    if (configId === "wheel_7") builderSpins += 1;

    const slice = sliceFromHistory(wheels, ev);
    if (slice == null) continue;

    if (slice.kind === "perk") perkWins += 1;
    if (isPositiveMoneySlice(slice)) {
      positiveHits += 1;
      const delta = slice.payload.moneyDelta ?? 0;
      if (delta >= 150) bigCashHits += 1;
    }
    if (isNegativeMoneySlice(slice)) negativeHits += 1;
  }

  const spins = events.length;
  const perkCount = run.perks?.length ?? 0;
  const peak = Math.max(1, run.peakMoney ?? run.money);
  const bankHeat = Math.min(1, run.money / peak);
  const spinHeat =
    spins > 0 ? Math.min(1, (positiveHits - negativeHits * 0.5) / Math.max(1, spins)) : 0;
  const luckyHeat = Math.min(1, (luckySpins * 0.22 + bigCashHits * 0.18) / Math.max(1, spins || 1));
  const builderHeat = Math.min(0.35, builderSpins * 0.08);
  const perkHeat = Math.min(0.4, perkCount * 0.06);

  const heat = Math.min(
    1,
    Math.max(0, spinHeat * 0.45 + luckyHeat * 0.25 + bankHeat * 0.2 + perkHeat + builderHeat)
  );

  const struggled = spins > 0 && negativeHits > positiveHits && run.money < peak * 0.55;

  const survivedDrain = drainSpins > 0;
  const drainPressure = survivedDrain && heat > 0.45 ? 0.12 + heat * 0.2 : 0;

  return {
    spins,
    heat,
    flatLossBias: struggled ? 0.1 : 0.22 + heat * 0.48,
    stakesBias: 0.14 + heat * 0.42 + (bankHeat > 0.75 ? 0.18 : 0) + drainPressure,
    perkTaxBias: 0.1 + perkHeat * 2 + (perkWins > 0 ? 0.12 : 0),
    payoutDampen: 0.35 + heat * 0.55,
  };
}

function isFlatLossPrize(prize: string): boolean {
  return prize.startsWith("money_loss_");
}

function isBossWipePrize(prize: string): boolean {
  return prize === "bank_wipe";
}

function isBossPayoutPrize(prize: string): boolean {
  return prize.startsWith("boss_pay");
}

/** Apply cycle audit to boss pool weights before picks. */
export function applyBossAuditToPool(
  pool: PoolPick[],
  audit: BossCycleAudit | undefined
): PoolPick[] {
  if (audit == null || audit.spins === 0) return pool;

  return pool.map((pick) => {
    let weight = pick.weight;
    const id = pick.prize;

    if (isFlatLossPrize(id)) {
      weight *= 1 + audit.flatLossBias;
    } else if (isBossWipePrize(id)) {
      weight *= 1 + audit.stakesBias;
    } else if (isBossPayoutPrize(id)) {
      weight *= Math.max(0.25, 1 - audit.payoutDampen);
    } else if (id === "neutral_nothing") {
      weight *= Math.max(0.5, 1 - audit.heat * 0.35);
    }

    return { ...pick, weight: Math.max(1, Math.round(weight)) };
  });
}

/** Stakes scale with cycle and how loaded the player is with perks. */
export function getBossStakesMult(cycle: number, perkCount: number): number {
  const c = Math.max(1, cycle);
  const perkLoad = Math.min(0.25, perkCount * 0.04);
  return 1 + (c - 1) * 0.08 + perkLoad;
}

/** Boss pool is flat −$ only — no dynamic perk-tax rows on the disc. */
export function getBossPoolAdjustments(_cycle: number, _perkCount: number): PoolPick[] {
  return [];
}

/** Chip payout when a cycle is cleared — reward surviving the boss, not jackpot slices. */
export function getBossCycleClearChips(run: RunState): number {
  const floor = run.floor;
  const base = 6 + floor * 3;
  const survival = Math.min(10, Math.floor(run.money / 120));
  const perkSurvived = (run.perks?.length ?? 0) >= 3 ? 2 : 0;
  return base + survival + perkSurvived;
}

/** Extra money loss mult on boss wheel hits (stacks with perks). */
export function getBossLossMult(run: RunState): number {
  const audit = summarizeCycleBeforeBoss(run, run.wheels);
  const heatMult = 1 + audit.heat * 0.12;
  return getBossStakesMult(run.floor, run.perks?.length ?? 0) * heatMult;
}

export function applyBossRunEffect(
  run: RunState,
  effectId: string
): RunState {
  const perks = run.perks?.length ?? 0;
  let next = run;

  switch (effectId) {
    case "boss_perk_tax": {
      if (perks <= 0) break;
      let rate = Math.min(0.35, 0.05 * perks);
      if (next.perks.includes("final_tax_shield")) {
        rate = Math.min(rate, 0.15);
      }
      const loss = Math.max(1, Math.floor(next.money * rate));
      next = applyBossMoneyLoss(next, loss);
      break;
    }
    case "boss_overhead": {
      const loss = Math.max(1, Math.floor(next.money * 0.12));
      next = applyBossMoneyLoss(next, loss);
      break;
    }
    case "boss_shield_break": {
      if ((next.shields ?? 0) > 0) {
        next = { ...next, shields: (next.shields ?? 1) - 1 };
      } else {
        const loss = Math.max(1, Math.floor(next.money * 0.15));
        next = applyBossMoneyLoss(next, loss);
      }
      break;
    }
    case "boss_chip_cache": {
      const chips = 6 + next.floor * 3;
      next = {
        ...next,
        chipsEarnedThisRun: (next.chipsEarnedThisRun ?? 0) + chips,
      };
      break;
    }
    case "boss_golden_seal": {
      const bonus = 40 + next.floor * 12;
      next = { ...next, money: next.money + bonus, shields: (next.shields ?? 0) + 1 };
      break;
    }
    default:
      break;
  }

  return next;
}

export function isBossTaxSlice(slice: SliceDefinition): boolean {
  const id = slice.payload.runEffectId;
  return id === "boss_perk_tax" || id === "boss_overhead" || id === "boss_shield_break";
}
