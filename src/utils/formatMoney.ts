/** Display bank balance without duplicate $ glyphs (no money icon + $ prefix). */
export function formatMoney(amount: number): string {
  return Math.max(0, Math.floor(amount)).toLocaleString("en-US");
}
