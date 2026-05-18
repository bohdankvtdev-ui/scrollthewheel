import type { RunState } from "../../schemas";

/** Stable key — `RunWheelFeed` memo only re-renders when reel-relevant run fields change. */
export function runReelFeedKey(run: RunState): string {
  const sliceCounts = run.wheels.map((w) => w.slices.length).join(".");
  const h = run.history.length;
  const lastSlice = h > 0 ? run.history[h - 1]!.sliceId : "";
  return [
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
    run.pendingWheelRebuild ? 1 : 0,
    run.runEffects?.microChoiceOffers?.join(",") ?? "",
  ].join("|");
}
