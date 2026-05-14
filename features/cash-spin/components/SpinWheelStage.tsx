import { SpinWheel } from "../../../wheel";
import { spinSafetyTimeoutMs } from "../../../lib/wheel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View, PixelRatio } from "react-native";
import {
  computeBulbRingLayout,
  computeBulbRingTopOffset,
  computeStageMinWidth,
  normalizeWheelInnerSize,
} from "../../../lib/layout/wheelFrame";
import { Neo, NeoBulbRingLayoutChrome, NeoWheel } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { SpinWheelItem } from "../../../types/spin";
import type { WheelPhysicsConfig } from "../../../lib/wheel";
import type { BulbRingPhase } from "../bulbRingPhase";
import { NeoBulbRing } from "./NeoBulbRing";
import { NeoKnob } from "./NeoKnob";

const DEFAULT_BULB_COUNT = 20;
const VICTORY_UI_MS = 3200;

export type SpinWheelStageProps = {
  data: SpinWheelItem[];
  wheelInnerSize: number;
  textSize: number;
  wheelPhysics: WheelPhysicsConfig;
  segmentColors: readonly string[];
  textColor: string;
  onSpinComplete: (item: SpinWheelItem) => void;
  /**
   * Optional: drive the bulb ring from the parent (`idle` | `spinning` | `victory`).
   * When omitted, the stage owns phase (spin → victory flash → idle).
   */
  bulbRingPhase?: BulbRingPhase;
  /** Notified on every phase change (internal or controlled prop updates). */
  onBulbRingPhaseChange?: (phase: BulbRingPhase) => void;
  /**
   * When this value changes (e.g. primary round index after a reel advance), the bulb ring
   * resets from victory/spinning timers so bulbs do not stay “all lit” on the next wheel.
   */
  ringPhaseResetKey?: number;
  /** Disables the spin hub (e.g. until prior rounds are claimed). */
  spinLocked?: boolean;
  /** Hub PNG decoded (or skipped); pass `hubLoadEpoch` from parent to ignore stale loads. */
  hubLoadEpoch?: number;
  onHubImageReady?: (epoch: number) => void;
};

export function SpinWheelStage({
  data,
  wheelInnerSize,
  textSize,
  wheelPhysics,
  segmentColors,
  textColor,
  onSpinComplete,
  bulbRingPhase: bulbRingPhaseProp,
  onBulbRingPhaseChange,
  ringPhaseResetKey,
  spinLocked = false,
  hubLoadEpoch = 0,
  onHubImageReady,
}: SpinWheelStageProps) {
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const victoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const lastRingPhaseResetKey = useRef<number | undefined>(undefined);
  const [internalPhase, setInternalPhase] = useState<BulbRingPhase>("idle");

  const ringPhase = bulbRingPhaseProp ?? internalPhase;

  useEffect(() => {
    onBulbRingPhaseChange?.(ringPhase);
  }, [ringPhase, onBulbRingPhaseChange]);

  const wheel = useMemo(() => normalizeWheelInnerSize(wheelInnerSize), [wheelInnerSize]);

  const layout = useMemo(
    () =>
      computeBulbRingLayout({
        wheelInnerSize: wheel,
        bulbCount: DEFAULT_BULB_COUNT,
        ...NeoBulbRingLayoutChrome,
      }),
    [wheel]
  );

  const ringTop = useMemo(
    () => computeBulbRingTopOffset(wheel, layout.outerDiameter),
    [wheel, layout.outerDiameter]
  );

  const stageWidth = useMemo(
    () => computeStageMinWidth(wheel, layout.outerDiameter),
    [wheel, layout.outerDiameter]
  );

  const clearSafety = useCallback(() => {
    if (safetyTimer.current != null) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, []);

  const clearVictory = useCallback(() => {
    if (victoryTimer.current != null) {
      clearTimeout(victoryTimer.current);
      victoryTimer.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSafety();
      clearVictory();
    };
  }, [clearSafety, clearVictory]);

  useEffect(() => {
    if (bulbRingPhaseProp !== undefined) return;
    if (ringPhaseResetKey === undefined) return;
    if (lastRingPhaseResetKey.current === undefined) {
      lastRingPhaseResetKey.current = ringPhaseResetKey;
      return;
    }
    if (lastRingPhaseResetKey.current === ringPhaseResetKey) return;
    lastRingPhaseResetKey.current = ringPhaseResetKey;
    clearSafety();
    clearVictory();
    setInternalPhase("idle");
    onBulbRingPhaseChange?.("idle");
  }, [bulbRingPhaseProp, ringPhaseResetKey, clearSafety, clearVictory, onBulbRingPhaseChange]);

  const armSafetyTimer = useCallback(() => {
    onBulbRingPhaseChange?.("spinning");
    if (bulbRingPhaseProp === undefined) {
      setInternalPhase("spinning");
    }
    clearSafety();
    safetyTimer.current = setTimeout(() => {
      safetyTimer.current = null;
      if (!mountedRef.current) return;
      if (bulbRingPhaseProp === undefined) {
        setInternalPhase((p) => (p === "spinning" ? "idle" : p));
      }
    }, spinSafetyTimeoutMs(wheelPhysics));
  }, [bulbRingPhaseProp, clearSafety, onBulbRingPhaseChange, wheelPhysics]);

  const onLibrarySpinEnd = useCallback(
    (item: SpinWheelItem) => {
      clearSafety();
      clearVictory();
      if (item != null && String(item.id ?? "").trim() !== "") {
        onSpinComplete(item);
        onBulbRingPhaseChange?.("victory");
        if (bulbRingPhaseProp === undefined) {
          setInternalPhase("victory");
          victoryTimer.current = setTimeout(() => {
            victoryTimer.current = null;
            if (!mountedRef.current) return;
            setInternalPhase("idle");
          }, VICTORY_UI_MS);
        }
      } else {
        onBulbRingPhaseChange?.("idle");
        if (bulbRingPhaseProp === undefined) {
          setInternalPhase("idle");
        }
      }
    },
    [bulbRingPhaseProp, clearSafety, clearVictory, onBulbRingPhaseChange, onSpinComplete]
  );

  if (data.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: Neo.textOnDark, fontWeight: "800" }}>No prizes configured.</Text>
      </View>
    );
  }

  const ringLeft = PixelRatio.roundToNearestPixel((stageWidth - layout.outerDiameter) / 2);
  const ringTopPx = PixelRatio.roundToNearestPixel(ringTop);

  return (
    <View style={{ width: stageWidth, alignItems: "center" }}>
      <View style={{ width: stageWidth, position: "relative", alignItems: "center" }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: ringTopPx,
            left: ringLeft,
            zIndex: 0,
          }}
        >
          <NeoBulbRing layout={layout} phase={ringPhase} />
        </View>

        <View style={{ zIndex: 1, alignItems: "center" }}>
          <SpinWheel
            data={data}
            size={wheel}
            wheelPhysics={wheelPhysics}
            segmentBgColor={[...segmentColors]}
            segmentStrokeColor={NeoWheel.segmentStroke}
            segmentStrokeWidth={NeoWheel.segmentStrokeWidth}
            segmentPadAngle={NeoWheel.segmentPadAngle}
            segmentCornerRadius={NeoWheel.segmentCornerRadius}
            textColor={textColor}
            textSize={Math.round(textSize * 1.28)}
            textFontWeight="400"
            labelFontFamily={FONT_BEBAS_NEUE}
            hubLabelFontFamily={FONT_BEBAS_NEUE}
            hubLabelColor="#FFFBEB"
            hubRingBorderWidth={NeoWheel.hubBorderWidth}
            hubRingBorderColor={NeoWheel.hubBorderWidth > 0 ? NeoWheel.hubBorder : undefined}
            showResultText={false}
            showSpinButton
            centerSpinButton
            hubSoftShadow={false}
            prizeSliceVictoryShine={ringPhase === "victory"}
            spinLocked={spinLocked}
            hubLoadEpoch={hubLoadEpoch}
            onHubImageLoad={onHubImageReady}
            knobComponent={<NeoKnob />}
            onSpinPress={armSafetyTimer}
            onSpinEnd={(item) => {
              onLibrarySpinEnd(item);
            }}
          />
        </View>
      </View>
    </View>
  );
}
