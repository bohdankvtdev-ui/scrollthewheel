import { describe, expect, it } from "vitest";
import {
  formatUsdTotal,
  parsePrizeDollarsFromLabel,
  sumClaimedPrizeDollars,
  sumPrizeDollarsFromRounds,
} from "./sumPrizes";

describe("sumPrizes", () => {
  it("parses wheel labels", () => {
    expect(parsePrizeDollarsFromLabel("$50")).toBe(50);
    expect(parsePrizeDollarsFromLabel("$1K")).toBe(1000);
    expect(parsePrizeDollarsFromLabel("$5K")).toBe(5000);
  });

  it("sums claimed rounds only for banked total", () => {
    const rounds = [
      { status: "claimed", prize: { id: "1", label: "$50" } },
      { status: "won", prize: { id: "2", label: "$100" } },
    ];
    expect(sumClaimedPrizeDollars(rounds)).toBe(50);
  });

  it("sums won and claimed for session helper", () => {
    const rounds = [
      { status: "claimed", prize: { id: "1", label: "$50" } },
      { status: "won", prize: { id: "2", label: "$100" } },
      { status: "ready", prize: null },
    ];
    expect(sumPrizeDollarsFromRounds(rounds)).toBe(150);
  });

  it("formats totals", () => {
    expect(formatUsdTotal(0)).toBe("—");
    expect(formatUsdTotal(1250)).toMatch(/\$1/);
  });
});
