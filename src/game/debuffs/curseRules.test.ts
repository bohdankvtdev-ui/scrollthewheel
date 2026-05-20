import { describe, expect, it } from "vitest";
import { removeAllCurses, removeOldestCurse } from "./curseRules";
import type { RunState } from "../../schemas";

function runWithDebuffs(...ids: string[]): RunState {
  return {
    runId: "t",
    phase: "active",
    floor: 1,
    wheelIndex: 0,
    money: 100,
    chipsEarnedThisRun: 0,
    perks: [],
    debuffs: ids,
    relics: [],
    advancements: [],
    history: [],
    wheels: [],
    sliceCapacity: 6,
    floorsCleared: 0,
  } as RunState;
}

describe("curseRules", () => {
  it("removes oldest curse first", () => {
    const next = removeOldestCurse(runWithDebuffs("debt_mark", "rusted_gear"));
    expect(next.debuffs).toEqual(["rusted_gear"]);
  });

  it("clears all curses", () => {
    const next = removeAllCurses(runWithDebuffs("debt_mark", "curse_of_greed"));
    expect(next.debuffs).toEqual([]);
  });
});
