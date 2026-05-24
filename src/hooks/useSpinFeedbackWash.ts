import { useEffect, useRef, useState } from "react";
import {
  cancelAnimation,
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { RUN_PAGE_BACKGROUND } from "../game/runVisual";
import {
  feedbackVisual,
  shouldPlayWashFlash,
  washFlashIntensity,
  WASH_FLASH_MS,
  type SpinFeedbackTier,
} from "../game/spinFeedback";

/**
 * Purple wheel-stage background tint.
 * +$ / −$: one 300ms flash per `washFlashEpoch` (color from `washFlashTier`).
 */
export function useSpinFeedbackWash(
  washFlashEpoch: number,
  washFlashTier: SpinFeedbackTier | null
) {
  const strength = useSharedValue(0);
  const overlayMul = useSharedValue(0.48);
  const tintColorRef = useRef(RUN_PAGE_BACKGROUND);
  const [washActive, setWashActive] = useState(false);

  useAnimatedReaction(
    () => strength.value > 0.02,
    (visible, prev) => {
      if (visible !== prev) {
        runOnJS(setWashActive)(visible);
      }
    }
  );

  useEffect(() => {
    if (washFlashEpoch <= 0 || washFlashTier == null) {
      cancelAnimation(strength);
      strength.value = 0;
      return;
    }

    if (!shouldPlayWashFlash(washFlashEpoch)) {
      return;
    }

    tintColorRef.current = feedbackVisual(washFlashTier)?.wash ?? RUN_PAGE_BACKGROUND;
    const { peak, overlay } = washFlashIntensity(washFlashTier);
    overlayMul.value = overlay;
    cancelAnimation(strength);
    strength.value = withSequence(
      withTiming(peak, { duration: 100, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: WASH_FLASH_MS - 100, easing: Easing.in(Easing.quad) })
    );
  }, [washFlashEpoch, washFlashTier, overlayMul]);

  const tintColor = tintColorRef.current;

  const stageBgStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        strength.value,
        [0, 1],
        [RUN_PAGE_BACKGROUND, tintColor]
      ),
    }),
    [tintColor]
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: strength.value * overlayMul.value,
  }));

  return { stageBgStyle, overlayStyle, washColor: tintColor, active: washActive };
}
