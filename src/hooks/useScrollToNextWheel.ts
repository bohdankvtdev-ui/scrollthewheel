import { useCallback, useEffect, useRef } from "react";
import type { FlashListRef } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { AccessibilityInfo } from "react-native";
import { AUTO_ADVANCE_MS } from "../animation/scrollSpring";

export function useScrollToNextWheel<T>(
  listRef: React.RefObject<FlashListRef<T> | null>,
  reducedMotion: boolean,
  itemHeight: number
) {
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const list = listRef.current;
      if (list == null) return;
      const useAnim = animated && !reducedMotion;
      list.scrollToOffset({ offset: Math.max(0, index * itemHeight), animated: useAnim });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [itemHeight, listRef, reducedMotion]
  );

  const scrollToNext = useCallback(
    (currentIndex: number, delayMs = AUTO_ADVANCE_MS) => {
      if (pendingRef.current != null) {
        clearTimeout(pendingRef.current);
      }
      pendingRef.current = setTimeout(() => {
        pendingRef.current = null;
        scrollToIndex(currentIndex + 1, true);
      }, delayMs) as unknown as number;
    },
    [scrollToIndex]
  );

  useEffect(() => {
    return () => {
      if (pendingRef.current != null) clearTimeout(pendingRef.current);
    };
  }, []);

  return { scrollToIndex, scrollToNext };
}

export async function getReducedMotionEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}
