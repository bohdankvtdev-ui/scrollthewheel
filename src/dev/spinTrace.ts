/**
 * Wheel spin diagnostics — logs to Metro/console (works with Hermes).
 * Filter Metro with: [spin]
 *
 * Hermes does not support legacy Chrome "Remote JS Debugging".
 * Use Expo's JS debugger (press `j` in the terminal) or `npx expo start --web`.
 */
const enabled =
  typeof __DEV__ !== "undefined" &&
  __DEV__ &&
  (globalThis as { __SPIN_TRACE__?: boolean }).__SPIN_TRACE__ !== false;

export function spinTrace(event: string, detail?: Record<string, unknown>): void {
  if (!enabled) return;
  if (detail != null) {
    console.log(`[spin] ${event}`, detail);
  } else {
    console.log(`[spin] ${event}`);
  }
}
