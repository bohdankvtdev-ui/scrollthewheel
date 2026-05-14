import type { SpinWheelItem } from "../../types/spin";

/**
 * Single formatter for spin result labels (SRP, testable).
 */
export function formatWinnerLabel(item: SpinWheelItem | null | undefined): string {
  if (item == null) return "—";
  const label = item.label?.trim();
  if (label) return label;
  const id = item.id?.trim();
  if (id) return `Prize ${id}`;
  return "—";
}
