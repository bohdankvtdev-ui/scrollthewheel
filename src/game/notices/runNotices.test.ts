import { describe, expect, it } from "vitest";
import { noticeDurationMs } from "./runNotices";
import { MICRO_CHOICE_META } from "../tactics/microChoices";

describe("runNotices", () => {
  it("scales duration with message length", () => {
    const short = noticeDurationMs("Retry");
    const long = noticeDurationMs("Insure", MICRO_CHOICE_META.insure.chosen);
    expect(long).toBeGreaterThan(short);
  });
});
