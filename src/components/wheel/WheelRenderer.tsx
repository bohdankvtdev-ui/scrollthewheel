import { useCallback, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SpinWheelRef } from "../../../wheel/types";
import { SpinWheel } from "../../../wheel";
import { CASH_SPIN_WHEEL_PROFILE } from "../../../lib/wheel/profiles";
import { resolveWheelPhysics } from "../../../lib/wheel/resolveWheelPhysics";
import { normalizeWheelInnerSize } from "../../../lib/layout/wheelFrame";
import { Neo, NeoWheel, neoTitleStyle } from "../../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import type { ResolvedWheel, RunState } from "../../schemas";
import { resolveSlice } from "../../systems/ProbabilityResolver";
import { RunManager } from "../../systems/RunManager";
import { buildResolveContext } from "../../hooks/useWheelModifiers";
import { useRunStore } from "../../stores/runStore";

type WheelRendererProps = {
  run: RunState;
  wheel: ResolvedWheel;
  wheelIndex: number;
  itemHeight: number;
  onSettled: (sliceId: string, sliceIndex: number) => void;
};

function physicsForProfile(profileId: string) {
  const base = CASH_SPIN_WHEEL_PROFILE.physics;
  if (profileId === "boss") {
    return resolveWheelPhysics({
      ...base,
      baseDurationMs: 7200,
      extraFullTurns: { min: 6, max: 12 },
    });
  }
  return base;
}

export function WheelRenderer({ run, wheel, wheelIndex, itemHeight, onSettled }: WheelRendererProps) {
  const wheelRef = useRef<SpinWheelRef>(null);
  const setSpinning = useRunStore((s) => s.setSpinning);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const isActive = run.wheelIndex === wheelIndex && run.phase === "active";
  const canSpin = RunManager.canSpin(run, wheelIndex) && isActive && !isSpinning;
  const locked = !canSpin;

  const segmentColors = useMemo(() => {
    return wheel.slices.map((s, i) => Neo.segmentColors[(s.presentation?.colorIndex ?? i) % Neo.segmentColors.length]!);
  }, [wheel.slices]);

  const { innerSize, textSize } = useMemo(() => {
    const inner = normalizeWheelInnerSize(Math.min(itemHeight * 0.52, 320));
    return { innerSize: inner, textSize: Math.round(inner * 0.065) };
  }, [itemHeight]);

  const wheelPhysics = useMemo(
    () => physicsForProfile(wheel.definition.physicsProfileId),
    [wheel.definition.physicsProfileId]
  );

  const onSpinEnd = useCallback(
    (_item: { id: string }, index: number) => {
      const slice = wheel.slices[index];
      if (slice == null) return;
      setSpinning(false);
      onSettled(slice.id, index);
    },
    [onSettled, setSpinning, wheel.slices]
  );

  const handleSpinPress = useCallback(() => {
    if (!canSpin) return;
    const ctx = buildResolveContext(run, wheel);
    const { index } = resolveSlice(wheel.slices, ctx);
    setSpinning(true);
    wheelRef.current?.spinToIndex(index);
  }, [canSpin, isSpinning, run, setSpinning, wheel]);

  return (
    <View style={[styles.stage, { height: itemHeight }]}>
      <Text style={neoTitleStyle(22)}>{wheel.definition.title}</Text>
      <View style={styles.wheelWrap}>
        <SpinWheel
          ref={wheelRef}
          data={wheel.spinItems}
          size={innerSize}
          wheelPhysics={wheelPhysics}
          segmentBgColor={segmentColors as string[]}
          textColor={Neo.wheelSliceLabel}
          textSize={textSize}
          segmentStrokeColor={NeoWheel.segmentStroke}
          segmentStrokeWidth={NeoWheel.segmentStrokeWidth}
          segmentPadAngle={NeoWheel.segmentPadAngle}
          segmentCornerRadius={NeoWheel.segmentCornerRadius}
          hubLabelFontFamily={FONT_BEBAS_NEUE}
          hubLabelColor={NeoWheel.hubText}
          labelFontFamily={FONT_BEBAS_NEUE}
          centerSpinButton
          showSpinButton
          spinLocked={locked}
          externalSpinControl
          onSpinPress={handleSpinPress}
          onSpinEnd={onSpinEnd}
        />
      </View>
      {locked && !isActive ? (
        <Text style={styles.locked}>Complete prior wheels first</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  wheelWrap: {
    marginTop: 8,
  },
  locked: {
    ...neoTitleStyle(14),
    marginTop: 8,
    opacity: 0.6,
  },
});
