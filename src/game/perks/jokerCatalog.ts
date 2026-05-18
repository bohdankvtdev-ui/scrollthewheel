import { PERK_CATALOG } from "../../data/perks";
import type { JokerDefinition, JokerTrigger } from "./joker.types";

const TRIGGER_BY_ID: Record<string, JokerTrigger> = {
  lucky_streak: "passive",
  iron_reserve: "onLoseMoney",
  ante_insurance: "passive",
  extra_slice: "passive",
  slice_expander: "passive",
  high_roller: "onGainMoney",
  gold_rush: "onGainMoney",
  safe_harbor: "onLoseMoney",
  coupon_king: "passive",
  hot_table: "onSpin",
  vip_roller: "onGainMoney",
  double_down: "onGainMoney",
  compounder: "onFloorEnd",
  final_guard: "passive",
  final_tax_shield: "passive",
  clutch_cash: "onFloorEnd",
};

const STACK: JokerDefinition["stackRule"] = "unique";

/** Joker catalog — extends perk data with trigger + stacking metadata. */
export const JOKER_CATALOG: Record<string, JokerDefinition> = Object.fromEntries(
  Object.entries(PERK_CATALOG).map(([id, p]) => [
    id,
    {
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      iconFamily: p.iconFamily,
      tier: p.tier,
      category:
        p.category === "economy"
          ? "economy"
          : p.category === "defense"
            ? "defensive"
            : p.category === "wheel"
              ? "wheel"
              : "meta",
      trigger: TRIGGER_BY_ID[id] ?? "passive",
      stackRule: STACK,
      chipsOnAcquire: p.tier >= 2 ? 5 + p.tier * 3 : undefined,
    } satisfies JokerDefinition,
  ])
);

export const JOKER_IDS = Object.keys(JOKER_CATALOG);
