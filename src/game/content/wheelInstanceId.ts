/** `wheel_1`, `wheel_1_f2`, `wheel_1_inj_money` → `wheel_1` */
export function wheelConfigIdFromInstanceId(wheelInstanceId: string): string {
  const m = wheelInstanceId.match(/^(wheel_\d+)/);
  return m?.[1] ?? wheelInstanceId.replace(/_f\d+$/, "");
}

export function isMoneyWheelInstanceId(wheelOrSliceId: string): boolean {
  return wheelConfigIdFromInstanceId(wheelOrSliceId) === "wheel_1";
}
