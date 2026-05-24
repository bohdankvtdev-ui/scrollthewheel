import { describe, expect, it } from "vitest";
import { shouldShowRunEndModal } from "./runLossFlow";

describe("shouldShowRunEndModal", () => {
  it("hides broke panel while last-chance overlay is active", () => {
    expect(
      shouldShowRunEndModal({
        phase: "lost_money",
        bossCyclePhase: "none",
        showDesperationPick: true,
        runEndFinalized: false,
        moneyReveal: null,
      })
    ).toBe(false);
  });

  it("hides broke panel during bankrupt money reveal", () => {
    expect(
      shouldShowRunEndModal({
        phase: "lost_money",
        bossCyclePhase: "none",
        showDesperationPick: false,
        runEndFinalized: false,
        moneyReveal: { before: 50, delta: -50 },
      })
    ).toBe(false);
  });

  it("shows broke panel only after run end is finalized", () => {
    expect(
      shouldShowRunEndModal({
        phase: "lost_money",
        bossCyclePhase: "none",
        showDesperationPick: false,
        runEndFinalized: true,
        moneyReveal: null,
      })
    ).toBe(true);
  });
});
