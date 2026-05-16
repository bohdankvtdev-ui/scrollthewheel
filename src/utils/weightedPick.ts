/** Uniform index in [0, length) — prefers crypto when available. */
export function secureRandomIndex(length: number): number {
  if (length <= 0) return 0;
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c != null && typeof c.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return Number(buf[0]!) % length;
  }
  return Math.floor(Math.random() * length);
}

export function pickWeightedIndex(weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return secureRandomIndex(weights.length);
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  let r =
    cryptoApi != null && typeof cryptoApi.getRandomValues === "function"
      ? (() => {
          const buf = new Uint32Array(1);
          cryptoApi.getRandomValues(buf);
          return (Number(buf[0]!) / 4294967296) * total;
        })()
      : Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
