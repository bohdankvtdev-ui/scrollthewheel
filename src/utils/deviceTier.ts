/** Logical window area (px²) below this ⇒ compact / memory-conscious UI tier. */
export const COMPACT_WINDOW_AREA = 420_000;

export function isCompactWindow(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  return Math.round(width * height) < COMPACT_WINDOW_AREA;
}
