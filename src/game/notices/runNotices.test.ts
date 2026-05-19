import { describe, expect, it, beforeEach } from "vitest";
import {
  noticeDurationMs,
  showDebuffWonNotice,
  showPerkWonNotice,
} from "./runNotices";
import { MICRO_CHOICE_META } from "../tactics/microChoices";
import { useRunToastStore } from "../../stores/runToastStore";

describe("runNotices", () => {
  beforeEach(() => {
    useRunToastStore.getState().dismiss();
  });

  it("scales duration with message length", () => {
    const short = noticeDurationMs("Retry");
    const long = noticeDurationMs("Insure", MICRO_CHOICE_META.insure.chosen);
    expect(long).toBeGreaterThan(short);
  });

  it("shows perk won notice", () => {
    showPerkWonNotice("iron_reserve");
    const toast = useRunToastStore.getState().toast;
    expect(toast?.title).toBe("Perk won");
    expect(toast?.body).toBe("Iron Shield");
    expect(toast?.type).toBe("success");
  });

  it("shows debuff notice", () => {
    showDebuffWonNotice("debt_mark");
    const toast = useRunToastStore.getState().toast;
    expect(toast?.title).toBe("Curse gained");
    expect(toast?.body).toBe("Debt Mark");
    expect(toast?.type).toBe("error");
  });
});
