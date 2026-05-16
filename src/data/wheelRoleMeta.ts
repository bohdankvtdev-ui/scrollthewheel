/** @deprecated Use WHEEL_STAGES from `src/game/loop` */
import { WHEEL_STAGES } from "../game/loop";
import type { WheelRole } from "../schemas";

export const WHEEL_ROLE_META = Object.fromEntries(
  Object.values(WHEEL_STAGES).map((s) => [
    s.role,
    { icon: s.icon, iconFamily: s.iconFamily, tag: s.label, hint: s.vibe, accent: s.accent },
  ])
) as Record<
  WheelRole,
  { icon: string; iconFamily: (typeof WHEEL_STAGES)[WheelRole]["iconFamily"]; tag: string; hint: string; accent: string }
>;
