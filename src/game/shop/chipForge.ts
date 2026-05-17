import type { RunState } from "../../schemas";
import { getSpendableChips, spendChips } from "./chipEconomy";

export type ChipForgeId =
  | "forge_cash"
  | "forge_guard"
  | "forge_chips"
  | "forge_percent"
  | "forge_barrier";

export type ChipForgeDef = {
  id: ChipForgeId;
  name: string;
  line: string;
  icon: string;
  baseCost: number;
  maxLevel: number;
};

export const CHIP_FORGE_CATALOG: Record<ChipForgeId, ChipForgeDef> = {
  forge_cash: {
    id: "forge_cash",
    name: "Cash Tune",
    line: "+4% cash from money wedges (stacking)",
    icon: "attach-money",
    baseCost: 4,
    maxLevel: 99,
  },
  forge_guard: {
    id: "forge_guard",
    name: "Loss Guard",
    line: "−3% cash lost on hits (stacking)",
    icon: "shield",
    baseCost: 5,
    maxLevel: 99,
  },
  forge_chips: {
    id: "forge_chips",
    name: "Chip Magnet",
    line: "+6% chips earned per spin (stacking)",
    icon: "poker-chip",
    baseCost: 4,
    maxLevel: 99,
  },
  forge_percent: {
    id: "forge_percent",
    name: "Percent Tune",
    line: "+3% bank from percent gains (stacking)",
    icon: "percent",
    baseCost: 6,
    maxLevel: 99,
  },
  forge_barrier: {
    id: "forge_barrier",
    name: "Barrier",
    line: "Every 2 levels: +1 loss shield",
    icon: "security",
    baseCost: 8,
    maxLevel: 20,
  },
};

export const CHIP_FORGE_ORDER: ChipForgeId[] = [
  "forge_cash",
  "forge_percent",
  "forge_guard",
  "forge_chips",
  "forge_barrier",
];

export function getForgeLevel(run: RunState, id: ChipForgeId): number {
  return run.chipForge?.[id] ?? 0;
}

/** Infinite scaling cost — gentle exponential. */
export function forgeUpgradeCost(run: RunState, id: ChipForgeId): number {
  const def = CHIP_FORGE_CATALOG[id];
  const level = getForgeLevel(run, id);
  if (level >= def.maxLevel) return 9999;
  return Math.max(2, Math.floor(def.baseCost * Math.pow(1.38, level)));
}

export function applyChipForgeToModifiers(run: RunState): RunState {
  const f = run.chipForge ?? {};
  const cashLvl = f.forge_cash ?? 0;
  const guardLvl = f.forge_guard ?? 0;
  const chipsLvl = f.forge_chips ?? 0;
  const pctLvl = f.forge_percent ?? 0;
  const barrierLvl = f.forge_barrier ?? 0;

  const base = run.modifiers ?? {
    moneyGainMult: 1,
    moneyLossMult: 1,
    rareWeightMult: 1,
    chipGainMult: 1,
  };

  const shieldsFromForge = Math.floor(barrierLvl / 2);
  const currentForgeShields = run.forgeShieldsGranted ?? 0;
  let shields = run.shields ?? 0;
  if (shieldsFromForge > currentForgeShields) {
    shields += shieldsFromForge - currentForgeShields;
  }

  return {
    ...run,
    shields,
    forgeShieldsGranted: shieldsFromForge,
    modifiers: {
      ...base,
      moneyGainMult: base.moneyGainMult * (1 + cashLvl * 0.04),
      moneyLossMult: Math.max(0.55, base.moneyLossMult * (1 - guardLvl * 0.03)),
      chipGainMult: base.chipGainMult * (1 + chipsLvl * 0.06),
      percentGainMult: (base.percentGainMult ?? 1) * (1 + pctLvl * 0.03),
    },
  };
}

export function buyChipForgeUpgrade(
  run: RunState,
  id: ChipForgeId
): { ok: true; run: RunState } | { ok: false; reason: string } {
  const def = CHIP_FORGE_CATALOG[id];
  if (def == null) return { ok: false, reason: "Unknown forge upgrade" };
  const level = getForgeLevel(run, id);
  if (level >= def.maxLevel) return { ok: false, reason: "Max level" };

  const cost = forgeUpgradeCost(run, id);
  if (getSpendableChips(run) < cost) return { ok: false, reason: "Not enough chips" };

  const afterPay = spendChips(run, cost);
  if (afterPay == null) return { ok: false, reason: "Not enough chips" };

  const chipForge = { ...(afterPay.chipForge ?? {}), [id]: level + 1 };
  return {
    ok: true,
    run: applyChipForgeToModifiers({ ...afterPay, chipForge }),
  };
}
