import { useCallback, useState } from "react";
import type { SpinWheelItem } from "../../../types/spin";

export type RoundStatus = "locked" | "ready" | "won" | "claimed";

export type ScrollWheelRound = {
  status: RoundStatus;
  prize: SpinWheelItem | null;
};

const DEFAULT_ROUND_COUNT = 6;

function createInitialRounds(count: number): ScrollWheelRound[] {
  return Array.from({ length: count }, (_, i) => ({
    status: i === 0 ? "ready" : "locked",
    prize: null,
  }));
}

export function useScrollTheWheelRounds(roundCount: number = DEFAULT_ROUND_COUNT) {
  const [rounds, setRounds] = useState<ScrollWheelRound[]>(() =>
    createInitialRounds(roundCount)
  );

  const reset = useCallback(() => {
    setRounds(createInitialRounds(roundCount));
  }, [roundCount]);

  const markSpinWon = useCallback((roundIndex: number, prize: SpinWheelItem) => {
    setRounds((prev) => {
      if (roundIndex < 0 || roundIndex >= prev.length) return prev;
      if (prev[roundIndex]?.status !== "ready") return prev;
      const next = [...prev];
      next[roundIndex] = { status: "won", prize };
      return next;
    });
  }, []);

  const markClaimed = useCallback((roundIndex: number) => {
    setRounds((prev) => {
      if (roundIndex < 0 || roundIndex >= prev.length) return prev;
      const cur = prev[roundIndex];
      if (cur?.status !== "won") return prev;
      const next = [...prev];
      next[roundIndex] = { status: "claimed", prize: cur.prize };
      const nxt = next[roundIndex + 1];
      if (nxt != null && nxt.status === "locked") {
        next[roundIndex + 1] = { ...nxt, status: "ready" };
      }
      return next;
    });
  }, []);

  /** Append locked rounds so the forward-only feed can keep growing (infinite-style). */
  const growToMinLength = useCallback((minLength: number) => {
    setRounds((prev) => {
      if (prev.length >= minLength) return prev;
      const add = minLength - prev.length;
      const tail = Array.from({ length: add }, () => ({
        status: "locked" as const,
        prize: null,
      }));
      return [...prev, ...tail];
    });
  }, []);

  return { rounds, markSpinWon, markClaimed, reset, growToMinLength };
}
