import { Easing } from "react-native";
import type { WheelDecelMode, WheelDecelPresetId } from "./types";

export function easingFromDecelPreset(id: WheelDecelPresetId): (t: number) => number {
  switch (id) {
    case "smooth":
      return Easing.out(Easing.cubic);
    case "dramatic":
      return Easing.bezier(0.08, 0.82, 0.12, 1);
    case "long_coast":
      return Easing.bezier(0.06, 0.74, 0.1, 1);
    case "tight_brake":
      return Easing.out(Easing.poly(4));
    case "cinematic":
      return Easing.out(Easing.poly(5));
    case "glide":
      return Easing.bezier(0.12, 0.72, 0.16, 1);
    case "friction": {
      const lambda = 4.65;
      const denom = 1 - Math.exp(-lambda);
      return (t: number) => {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        return (1 - Math.exp(-lambda * t)) / denom;
      };
    }
    default:
      return Easing.out(Easing.cubic);
  }
}

/** Softer pool — fewer harsh brakes, more coast + glide for consistent polish. */
const DECEL_POOL: readonly WheelDecelPresetId[] = [
  "friction",
  "glide",
  "long_coast",
  "friction",
  "smooth",
  "long_coast",
  "glide",
  "cinematic",
  "smooth",
  "dramatic",
];

export function pickRandomDecelFromPool(): (t: number) => number {
  const id = DECEL_POOL[Math.floor(Math.random() * DECEL_POOL.length)]!;
  return easingFromDecelPreset(id);
}

export function resolveDecelEasing(decel: WheelDecelMode): (t: number) => number {
  if (decel.kind === "random_pool") {
    return pickRandomDecelFromPool();
  }
  return easingFromDecelPreset(decel.preset);
}
