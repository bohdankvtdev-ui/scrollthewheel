import { describe, expect, it } from "vitest";
import { RunManager } from "../systems/RunManager";
import { buildRunReelRounds } from "./useRunReelRounds";

describe("buildRunReelRounds boss cycle", () => {
  it("keeps last wheel won while boss transition is pending on reel", () => {
    let run = RunManager.createInitialRun(1);
    run = {
      ...run,
      wheelIndex: 8,
      phase: "active",
      history: [
        ...run.history,
        { wheelIndex: 8, sliceId: "slice-0", floor: 1, ts: Date.now() },
      ],
    };
    const rounds = buildRunReelRounds(run, false, "Boss prize", false, true);
    expect(rounds[8]?.status).toBe("won");
    expect(rounds[8]?.prize?.label).toBe("Boss prize");
  });
});
