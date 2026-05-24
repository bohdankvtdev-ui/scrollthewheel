import type { RunState } from "../../schemas";

/**
 * UI flags that affect reel round labels — bust `RunWheelFeed` memo when they change.
 * Do not include `isSpinning`: busting the memo remounts the whole feed and wipes
 * `armedSpinSession` mid-spin (builder wheel freeze).
 */
export function runReelUiKey(input: {
  awaitingClaim: boolean;
  gambleFlipActive: boolean;
  lastResultLabel: string | null;
}): string {
  return [
    input.awaitingClaim ? 1 : 0,
    input.gambleFlipActive ? 1 : 0,
    input.lastResultLabel ?? "",
  ].join("|");
}

/** Stable key — `RunWheelFeed` memo only re-renders when reel-relevant run fields change. */
export function runReelFeedKey(run: RunState): string {
  const sliceCounts = run.wheels.map((w) => w.slices.length).join(".");
  const h = run.history.length;
  const lastSlice = h > 0 ? run.history[h - 1]!.sliceId : "";
  return [
    run.floor,
    run.wheelIndex,
    run.phase,
    h,
    lastSlice,
    run.money,
    run.perks.length,
    run.debuffs.length,
    run.shields ?? 0,
    run.chipsEarnedThisRun ?? 0,
    run.advancements?.length ?? 0,
    sliceCounts,
    run.runEffects?.microChoiceOffers?.join(",") ?? "",
  ].join("|");
}
