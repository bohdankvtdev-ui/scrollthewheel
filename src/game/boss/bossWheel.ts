import type { RunState } from "../../schemas";
import type { SliceDefinition } from "../../schemas";
import type { PoolPick } from "../wheels/database/wheelPrizePools";

function applyBossMoneyLoss(run: RunState, loss: number): RunState {
  if (loss <= 0) return run;
  return { ...run, money: Math.max(0, run.money - loss) };
}

/** Boss / final wheel land % — heavy weight on first (harshest) slices. */
export const BOSS_LAND_SHAPE = [30, 24, 18, 14, 9, 5] as const;

/** Final wheel — even harsher odds on the worst wedges. */
export const FINAL_LAND_SHAPE = [34, 26, 18, 12, 7, 3] as const;

/** Stakes scale with cycle and how loaded the player is with perks. */
export function getBossStakesMult(cycle: number, perkCount: number): number {
  const c = Math.max(1, cycle);
  const perkLoad = Math.min(0.25, perkCount * 0.04);
  return 1 + (c - 1) * 0.08 + perkLoad;
}

export function getBossPoolAdjustments(cycle: number, perkCount: number): PoolPick[] {
  const extras: PoolPick[] = [];
  if (perkCount >= 2) {
    extras.push({ prize: "boss_perk_tax", weight: 6 + perkCount * 2 });
  }
  if (perkCount >= 4) {
    extras.push({ prize: "boss_overhead", weight: 8 });
  }
  if (cycle >= 3) {
    extras.push({ prize: "bank_cut_75", weight: 6 });
  }
  return extras;
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
  return getBossStakesMult(run.floor, run.perks?.length ?? 0);
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
