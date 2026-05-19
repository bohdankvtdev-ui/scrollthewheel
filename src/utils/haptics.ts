import * as Haptics from "expo-haptics";
import { useMetaStore } from "../stores/metaStore";

function hapticsEnabled(): boolean {
  const meta = useMetaStore.getState();
  return meta.hydrated ? meta.settings.haptics : true;
}

export function runHapticImpact(style: Haptics.ImpactFeedbackStyle): void {
  if (!hapticsEnabled()) return;
  void Haptics.impactAsync(style);
}

export function runHapticNotification(type: Haptics.NotificationFeedbackType): void {
  if (!hapticsEnabled()) return;
  void Haptics.notificationAsync(type);
}

export function runHapticSelection(): void {
  if (!hapticsEnabled()) return;
  void Haptics.selectionAsync();
}
