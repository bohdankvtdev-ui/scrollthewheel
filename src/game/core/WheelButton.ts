import type { RunState } from "../../schemas";

export type WheelButtonGate = {
  canSpin: boolean;
  reason?: string;
};

/**
 * Hub spin button rules — keep UI thin; logic stays testable here.
 */
export function evaluateWheelButton(run: RunState, isSpinning: boolean): WheelButtonGate {
  if (run.phase !== "active") {
    return { canSpin: false, reason: "Run ended" };
  }
  if (isSpinning) {
    return { canSpin: false, reason: "Spin in progress" };
  }
  if (run.wheelIndex < 0 || run.wheelIndex >= run.wheels.length) {
    return { canSpin: false, reason: "Invalid wheel" };
  }
  return { canSpin: true };
}
