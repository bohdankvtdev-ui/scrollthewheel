import { RUN_PIPELINE } from "../catalogs/wheel-pipeline.catalog";
import type { WheelDefinition } from "../../schemas";

/**
 * Returns wheel definitions for a floor. IDs are suffixed with floor for save/debug clarity.
 */
export function getPipelineForFloor(floor: number): WheelDefinition[] {
  const f = Math.max(1, floor);
  return RUN_PIPELINE.map((w) => ({
    ...w,
    id: `${w.id}_f${f}`,
    title: f > 1 ? `${w.title} · F${f}` : w.title,
  }));
}
