import { describe, expect, it } from "vitest";
import { RunManager } from "../../systems/RunManager";
import { deriveHubMode, reconcileRunUi } from "./wheelHubState";
import { withTacticWheelIndices } from "./tacticWheels";

describe("wheelHubState", () => {
  it("busy hub when awaiting result on current wheel", () => {
    const run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const mode = deriveHubMode({
      run,
      roundIndex: 0,
      isSpinning: false,
      awaitingClaim: true,
      gambleFlipActive: false,
      isReelActive: true,
      round: { status: "won", prize: { id: "x", label: "+$10" } },
    });
    expect(mode).toBe("busy");
  });

  it("spin hub on ready wheel after claim (not won status alone)", () => {
    const run = withTacticWheelIndices({ ...RunManager.createInitialRun(1), wheelIndex: 1 });
    const mode = deriveHubMode({
      run,
      roundIndex: 1,
      isSpinning: false,
      awaitingClaim: false,
      gambleFlipActive: false,
      isReelActive: true,
      round: { status: "ready", prize: null },
    });
    expect(mode).toBe("spin");
  });

  it("busy when reel slot is not the run wheel index", () => {
    const run = withTacticWheelIndices({ ...RunManager.createInitialRun(1), wheelIndex: 1 });
    const mode = deriveHubMode({
      run,
      roundIndex: 0,
      isSpinning: false,
      awaitingClaim: false,
      gambleFlipActive: false,
      isReelActive: true,
      round: { status: "ready", prize: null },
    });
    expect(mode).toBe("busy");
  });

  it("spin mode during gamble flip", () => {
    const run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const mode = deriveHubMode({
      run,
      roundIndex: 0,
      isSpinning: false,
      awaitingClaim: false,
      gambleFlipActive: true,
      isReelActive: true,
      round: { status: "ready", prize: null },
    });
    expect(mode).toBe("spin");
  });

  it("clears stale isSpinning from prior wheel", () => {
    const run = withTacticWheelIndices(RunManager.createInitialRun(1));
    const ui = reconcileRunUi(
      { ...run, wheelIndex: 2 },
      {
        awaitingClaim: false,
        gambleFlipActive: false,
        isSpinning: true,
        spinWheelIndex: 1,
        lastResultLabel: null,
        lastSliceId: null,
        lastEffect: null,
        lastRewardKind: null,
        moneyReveal: null,
      }
    );
    expect(ui.isSpinning).toBe(false);
    expect(ui.spinWheelIndex).toBeNull();
  });

  it("does not restore awaitingClaim from a previous cycle on the same wheel index", () => {
    let run = RunManager.createInitialRun(1);
    run = {
      ...run,
      floor: 2,
      wheelIndex: 0,
      history: [{ wheelIndex: 0, sliceId: "s1", floor: 1, ts: 1 }],
    };
    const ui = reconcileRunUi(run, {
      awaitingClaim: false,
      gambleFlipActive: false,
      isSpinning: false,
      spinWheelIndex: null,
      lastResultLabel: null,
      lastSliceId: null,
      lastEffect: null,
      lastRewardKind: null,
      moneyReveal: null,
    });
    expect(ui.awaitingClaim).toBe(false);
  });

  it("reconcile restores awaitingClaim when history exists", () => {
    let run = RunManager.createInitialRun(1);
    run = {
      ...run,
      history: [{ wheelIndex: 0, sliceId: "s1", floor: run.floor, ts: 1 }],
    };
    const ui = reconcileRunUi(run, {
      awaitingClaim: false,
      gambleFlipActive: false,
      isSpinning: false,
      spinWheelIndex: null,
      lastResultLabel: null,
      lastSliceId: null,
      lastEffect: null,
      lastRewardKind: null,
      moneyReveal: null,
    });
    expect(ui.awaitingClaim).toBe(true);
    expect(ui.lastResultLabel).not.toBeNull();
  });
});
