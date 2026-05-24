import { describe, expect, it } from "vitest";

import { ICON_REGISTRY } from "./iconRegistry";

import { getConfiguredWheelSlices } from "../wheels/database/loader";

import { FLOOR_WHEEL_ORDER } from "../wheels/database/wheelDatabase";

import {

  __moneyGainIconForTest,

  MONEY_WHEEL_CASH_ICON,

  MONEY_WHEEL_LOSS_ICON,

} from "./prizeIcons";



function duplicateIconsInBucket(bucket: Record<string, { icon: string; iconFamily: string }>) {

  const byIcon = new Map<string, string[]>();

  for (const [id, spec] of Object.entries(bucket)) {

    const key = `${spec.iconFamily}:${spec.icon}`;

    const list = byIcon.get(key) ?? [];

    list.push(id);

    byIcon.set(key, list);

  }

  return [...byIcon.entries()].filter(([, ids]) => ids.length > 1);

}



describe("icon audit", () => {

  it("perk registry has unique icons per perk", () => {

    const dups = duplicateIconsInBucket(ICON_REGISTRY.perk);

    expect(dups, dups.map(([k, ids]) => `${k} → ${ids.join(", ")}`).join("\n")).toEqual([]);

  });



  it("relic registry has unique icons per relic", () => {

    const dups = duplicateIconsInBucket(ICON_REGISTRY.relic);

    expect(dups, dups.map(([k, ids]) => `${k} → ${ids.join(", ")}`).join("\n")).toEqual([]);

  });



  it("card and debuff registries have unique icons", () => {

    expect(duplicateIconsInBucket(ICON_REGISTRY.card)).toEqual([]);

    expect(duplicateIconsInBucket(ICON_REGISTRY.debuff)).toEqual([]);

  });



  it("money wheel uses attach-money for every +$ wedge", () => {

    const slices = getConfiguredWheelSlices("wheel_1", "wheel_1", 1);

    expect(slices.every((s) => s.kind !== "money" || s.icon === "attach-money")).toBe(true);

  });



  it("money wheel uses money-off for −$ wedges", () => {

    const slices = getConfiguredWheelSlices("wheel_1", "wheel_1", 2);

    expect(slices.every((s) => s.kind !== "money_loss" || s.icon === "money-off")).toBe(true);

  });



  it("chaos and boss wheels use attach-money / money-off for flat cash", () => {

    for (const id of ["wheel_8", "wheel_9"] as const) {

      const slices = getConfiguredWheelSlices(id, id, { runId: "icon-audit", cycle: 2 });

      for (const s of slices) {

        if (s.kind === "money") {

          expect(s.icon, `${id} ${s.id}`).toBe("attach-money");

        }

        if (s.kind === "money_loss") {

          expect(s.icon, `${id} ${s.id}`).toBe("money-off");

        }

      }

    }

  });



  it("all +$ tiers resolve to the same cash icon", () => {

    const amounts = [50, 80, 100, 120, 150, 200, 500];

    for (const a of amounts) {

      expect(__moneyGainIconForTest(a)).toEqual(MONEY_WHEEL_CASH_ICON);

    }

    expect(MONEY_WHEEL_LOSS_ICON).toEqual({ icon: "money-off", iconFamily: "MaterialIcons" });

  });



  it("perk slices on wheel_4 resolve registry icons", () => {

    const slices = getConfiguredWheelSlices("wheel_4", "wheel_4", 1);

    for (const s of slices) {

      if (s.kind !== "perk" || s.payload.perkId == null) continue;

      const reg = ICON_REGISTRY.perk[s.payload.perkId as keyof typeof ICON_REGISTRY.perk];

      expect(reg, s.payload.perkId).toBeDefined();

      expect(s.icon).toBe(reg!.icon);

      expect(s.iconFamily).toBe(reg!.iconFamily);

    }

  });



  it("all floor wheels build with six slices", () => {

    for (const id of FLOOR_WHEEL_ORDER) {

      expect(getConfiguredWheelSlices(id, id, 1)).toHaveLength(6);

    }

  });

});

