import type { RunState } from "../../schemas";
import { getSpendableChips, spendChips } from "./chipEconomy";

export type ConsumableId = "wedge_eraser";

export type ConsumableDef = {
  id: ConsumableId;
  name: string;
  line: string;
  icon: string;
  baseCost: number;
  maxStack: number;
};

export const CONSUMABLE_CATALOG: Record<ConsumableId, ConsumableDef> = {
  wedge_eraser: {
    id: "wedge_eraser",
    name: "Wedge Eraser",
    line: "Tap in loadout → tap a wedge to banish it from that wheel",
    icon: "eraser",
    baseCost: 9,
    maxStack: 8,
  },
};

export function consumableCost(run: RunState, id: ConsumableId): number {
  const owned = run.inventory?.wedgeEraser ?? 0;
  const def = CONSUMABLE_CATALOG[id];
  return Math.max(3, Math.floor(def.baseCost * (1 + owned * 0.12)));
}

export function buyConsumable(
  run: RunState,
  id: ConsumableId
): { ok: true; run: RunState } | { ok: false; reason: string } {
  const def = CONSUMABLE_CATALOG[id];
  const stack = run.inventory?.wedgeEraser ?? 0;
  if (stack >= def.maxStack) return { ok: false, reason: "Inventory full" };

  const cost = consumableCost(run, id);
  const afterPay = spendChips(run, cost);
  if (afterPay == null) return { ok: false, reason: "Not enough chips" };

  const inventory = { ...(afterPay.inventory ?? {}), wedgeEraser: stack + 1 };
  return { ok: true, run: { ...afterPay, inventory } };
}

export function useWedgeEraser(run: RunState): RunState | null {
  const n = run.inventory?.wedgeEraser ?? 0;
  if (n <= 0) return null;
  return {
    ...run,
    inventory: { ...run.inventory, wedgeEraser: n - 1 },
  };
}
