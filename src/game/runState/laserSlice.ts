import type { FloorWheelOrderId } from "../wheels/database/wheelDatabase";
import { LASER_MIN_SLICE_COUNT } from "../wheels/sliceCapacityBonus";
import type { RunState } from "./types";
import { useWedgeEraser } from "../shop/consumables";
import { patchResolvedWheelSlices } from "../../systems/WheelSystem";

export { LASER_MIN_SLICE_COUNT };

/** Remove one wedge from the active wheel and consume a Wedge Laser charge. */
export function laserRemoveSliceFromWheel(
  run: RunState,
  wheelIndex: number,
  sliceIndex: number
): { ok: true; run: RunState } | { ok: false; reason: string } {
  const wheel = run.wheels[wheelIndex];
  const configId = wheel?.definition.wheelConfigId as FloorWheelOrderId | undefined;
  const slice = wheel?.slices[sliceIndex];
  if (configId == null || slice == null) {
    return { ok: false, reason: "Invalid wedge" };
  }
  if (wheelIndex !== run.wheelIndex) {
    return { ok: false, reason: "Can only laser the current wheel" };
  }
  if (wheel.slices.length <= LASER_MIN_SLICE_COUNT) {
    return {
      ok: false,
      reason: `This wheel needs at least ${LASER_MIN_SLICE_COUNT} wedges`,
    };
  }

  const afterEraser = useWedgeEraser(run);
  if (afterEraser == null) return { ok: false, reason: "No Wedge Laser in inventory" };

  const nextSlices = wheel.slices.filter((_, i) => i !== sliceIndex);
  const patchedWheel = patchResolvedWheelSlices(wheel, nextSlices);
  const wheels = run.wheels.map((w, i) => (i === wheelIndex ? patchedWheel : w));
  const cuts = (afterEraser.wheelLaserCuts?.[configId] ?? 0) + 1;

  return {
    ok: true,
    run: {
      ...afterEraser,
      wheels,
      wheelLaserCuts: { ...(afterEraser.wheelLaserCuts ?? {}), [configId]: cuts },
    },
  };
}
