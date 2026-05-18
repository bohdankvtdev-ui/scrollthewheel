import { describe, expect, it } from "vitest";
import { getBossCycleClearChips, getBossStakesMult } from "./bossWheel";

describe("bossWheel", () => {
  it("stakes scale with cycle and perk load", () => {
    expect(getBossStakesMult(1, 0)).toBe(1);
    expect(getBossStakesMult(3, 4)).toBeGreaterThan(getBossStakesMult(1, 0));
  });

  it("cycle clear chips reward bank survival", () => {
    const poor = { floor: 1, money: 0, perks: [] as string[] };
    const rich = { floor: 1, money: 600, perks: ["a", "b", "c"] };
    expect(getBossCycleClearChips(rich as never)).toBeGreaterThan(getBossCycleClearChips(poor as never));
  });
});
