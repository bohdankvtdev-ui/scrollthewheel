import type { RunEffectId } from "../gdd";
import { getConfigIdForArchetype } from "../gdd";
import type { RunState } from "./types";
import type { SliceDefinition } from "../../schemas";
import { applyMoneyDelta } from "../../systems/PerkSystem";
import { syncRunWheels } from "../../systems/WheelSystem";
import { FLOOR_WHEEL_ORDER } from "../wheels/database";

export type RunEffectsState = {
  forcedArchetypeByIndex?: Record<number, string>;
  negativeBiasBonus?: number;
  corruptionRemainingWheels?: number;
  doomSpiralRemainingWheels?: number;
  debtShieldUsedThisCycle?: boolean;
  ironGritUsed?: boolean;
};

export const DEFAULT_RUN_EFFECTS: RunEffectsState = {};

export function isSliceNegative(slice: SliceDefinition): boolean {
  const { payload, kind } = slice;
  if (kind === "money_loss" || kind === "bank_wipe" || kind === "bank_cut") {
    return true;
  }
  if (payload.wipeBank) return true;
  if (payload.bankPercent != null && payload.bankPercent < 0) return true;
  if (payload.moneyDelta != null && payload.moneyDelta < 0) return true;
  return false;
}

function forceWheelArchetype(run: RunState, wheelIndex: number, archetype: "drain" | "chaos" | "lucky"): RunState {
  const configId = getConfigIdForArchetype(archetype);
  if (configId == null) return run;
  const forced = { ...(run.runEffects?.forcedArchetypeByIndex ?? {}), [wheelIndex]: configId };
  return syncRunWheels({
    ...run,
    runEffects: { ...run.runEffects, forcedArchetypeByIndex: forced },
    pendingWheelRebuild: true,
  });
}

export function applyRunEffect(run: RunState, slice: SliceDefinition, wheelIndex: number): RunState {
  const effectId = slice.payload.runEffectId as RunEffectId | undefined;
  let next = run;

  if (effectId == null) return next;

  switch (effectId) {
    case "debt_bomb": {
      const loss = Math.floor(next.money * 0.3);
      next = applyMoneyDelta(next, -loss) as RunState;
      if (!next.debuffs.includes("debt_mark")) {
        next = { ...next, debuffs: [...next.debuffs, "debt_mark"] };
      }
      break;
    }
    case "lock_drain":
      next = forceWheelArchetype(next, wheelIndex + 1, "drain");
      break;
    case "boss_ghost":
      next = {
        ...next,
        runEffects: {
          ...next.runEffects,
          negativeBiasBonus: (next.runEffects?.negativeBiasBonus ?? 0) + 0.2,
        },
      };
      break;
    case "corruption_spread":
      if (!next.relics.includes("firewall")) {
        next = {
          ...next,
          runEffects: {
            ...next.runEffects,
            corruptionRemainingWheels: 3,
            negativeBiasBonus: (next.runEffects?.negativeBiasBonus ?? 0) + 0.12,
          },
        };
      }
      break;
    case "doom_spiral": {
      const chaosId = getConfigIdForArchetype("chaos");
      const forced: Record<number, string> = { ...(next.runEffects?.forcedArchetypeByIndex ?? {}) };
      if (chaosId != null) {
        for (let i = wheelIndex + 1; i < FLOOR_WHEEL_ORDER.length; i++) {
          forced[i] = chaosId;
        }
      }
      next = syncRunWheels({
        ...next,
        runEffects: {
          ...next.runEffects,
          forcedArchetypeByIndex: forced,
          doomSpiralRemainingWheels: 3,
          negativeBiasBonus: (next.runEffects?.negativeBiasBonus ?? 0) + 0.3,
        },
        pendingWheelRebuild: true,
      });
      break;
    }
    default:
      break;
  }

  return next;
}

/** First negative hit per cycle ignored when Debt Shield relic owned */
export function shouldDebtShieldBlock(run: RunState, slice: SliceDefinition): boolean {
  if (!run.relics.includes("debt_shield")) return false;
  if (run.runEffects?.debtShieldUsedThisCycle) return false;
  return isSliceNegative(slice);
}

export function markDebtShieldUsed(run: RunState): RunState {
  return {
    ...run,
    runEffects: { ...run.runEffects, debtShieldUsedThisCycle: true },
  };
}

export function tickRunEffectsOnWheelAdvance(run: RunState): RunState {
  const fx = run.runEffects ?? {};
  let corruption = fx.corruptionRemainingWheels ?? 0;
  let doom = fx.doomSpiralRemainingWheels ?? 0;
  if (corruption > 0) corruption -= 1;
  if (doom > 0) doom -= 1;
  const nextFx: RunEffectsState = {
    ...fx,
    corruptionRemainingWheels: corruption > 0 ? corruption : undefined,
    doomSpiralRemainingWheels: doom > 0 ? doom : undefined,
    debtShieldUsedThisCycle: undefined,
  };
  if (corruption <= 0 && doom <= 0 && fx.debtShieldUsedThisCycle == null) {
    return { ...run, runEffects: { ...nextFx, negativeBiasBonus: fx.negativeBiasBonus } };
  }
  return { ...run, runEffects: nextFx };
}

export function resetCycleRunEffects(run: RunState): RunEffectsState {
  return {
    negativeBiasBonus: run.runEffects?.negativeBiasBonus,
    forcedArchetypeByIndex: undefined,
    corruptionRemainingWheels: undefined,
    doomSpiralRemainingWheels: undefined,
    debtShieldUsedThisCycle: undefined,
  };
}
