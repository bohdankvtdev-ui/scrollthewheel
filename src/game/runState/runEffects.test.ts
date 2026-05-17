import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { applyRunEffect } from "./runEffects";
import type { SliceDefinition } from "../../schemas";

function slice(partial: Partial<SliceDefinition> & { payload?: SliceDefinition["payload"] }): SliceDefinition {
  return {
    id: "test_slice",
    kind: "run_effect",
    label: "Test",
    icon: "help",
    iconFamily: "MaterialIcons",
    baseWeight: 10,
    payload: {},
    ...partial,
  };
}

describe("runEffects", () => {
  it("doom spiral forces chaos wheels without instant fail", () => {
    const run = RunManager.createInitialRun(1);
    const next = applyRunEffect(
      run,
      slice({ payload: { runEffectId: "doom_spiral" } }),
      7
    );
    expect(next.phase).toBe("active");
    expect(next.runEffects?.doomSpiralRemainingWheels).toBe(3);
    expect(next.runEffects?.forcedArchetypeByIndex?.[8]).toBe("wheel_8");
  });
});
