import type { IconFamily, RunState } from "../../schemas";

export type PitStopOptionId = "pit_laser" | "pit_cash" | "pit_chips";

export type PitStopOption = {
  id: PitStopOptionId;
  title: string;
  line: string;
  icon: string;
  iconFamily: IconFamily;
};

export const PIT_STOP_OPTIONS: PitStopOption[] = [
  {
    id: "pit_laser",
    title: "Wedge Laser",
    line: "+1 laser charge",
    icon: "ray-start",
    iconFamily: "MaterialCommunityIcons",
  },
  {
    id: "pit_cash",
    title: "Cash infusion",
    line: "+$50 bank",
    icon: "payments",
    iconFamily: "MaterialIcons",
  },
  {
    id: "pit_chips",
    title: "Chip stash",
    line: "+10 shop chips",
    icon: "plus-circle-multiple-outline",
    iconFamily: "MaterialCommunityIcons",
  },
];

export function applyPitStopChoice(run: RunState, id: PitStopOptionId): RunState {
  switch (id) {
    case "pit_laser": {
      const n = run.inventory?.wedgeEraser ?? 0;
      return {
        ...run,
        inventory: { ...run.inventory, wedgeEraser: n + 1 },
      };
    }
    case "pit_cash":
      return { ...run, money: run.money + 50 };
    case "pit_chips":
      return { ...run, chipsEarnedThisRun: (run.chipsEarnedThisRun ?? 0) + 10 };
    default:
      return run;
  }
}
