import React, { forwardRef, memo, useEffect, useId, useImperativeHandle, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { runHapticImpact } from "../../src/utils/haptics";
import { Image } from "expo-image";
import Svg, { Defs, G, Image as SvgImage, Path, RadialGradient, Stop, Text as SvgText } from "react-native-svg";
import * as d3Shape from "d3-shape";
import { SPIN_WHEEL_PRIZE_RING_OUTER_INSET } from "../../lib/layout/wheelFrame";
import { Neo, NeoBulbRingTheme } from "../../theme/neoBrutal";
import { useSpinWheel } from "../hooks/useSpinWheel";
import type { SpinWheelItem, SpinWheelProps, SpinWheelRef } from "../types";
import { SliceIconLayer } from "./SliceIconLayer";
import { SliceTouchLayer } from "./SliceTouchLayer";

const windowWidth = Dimensions.get("window").width;
const ONE_TURN = 360;
const HUB_ICON_COLOR = "#FFFFFF";
/** Web focus rings on hub/slice pressables read as a harsh square around the wheel. */
const WEB_PRESSABLE_RESET =
  Platform.OS === "web" ? ({ outlineWidth: 0 } as const) : null;

/** Counter-rotate labels/images so copy stays screen-upright once the wheel has stopped. */
function prizeUprightTransform(
  cx: number,
  cy: number,
  startAngle: number,
  endAngle: number,
  wheelDeg: number,
  sliceRadialOffsetDeg: number
): string {
  const mid = (startAngle + endAngle) / 2;
  let deg = (mid * 180) / Math.PI - 90;
  if (deg > 90 && deg < 270) deg += 180;
  const wheelNorm = ((wheelDeg % 360) + 360) % 360;
  return `rotate(${deg - wheelNorm + sliceRadialOffsetDeg}, ${cx}, ${cy})`;
}

/** Center “Spin” hub artwork (transparent PNG). */
const SPIN_HUB_IMAGE = require("../../assets/images/middle.png");

const DefaultKnob = ({
  width = 50,
  height = 50,
}: {
  width?: number;
  height?: number;
}) => (
  <Svg width={width} height={height} viewBox="-1 -1 514.069 514.069">
    <G transform="translate(1 1)">
      <Path
        d="M255.035 502.421 L459.835 33.087 L255.035 169.621 L58.768 41.621 Z"
        fill="#FFE100"
      />
      <Path
        d="M7.568 7.487 L255.035 502.421 L58.768 41.621 L255.035 169.621 Z"
        fill="#FFFFFF"
      />
      <Path d="M458.128 36.501 L255.035 502.421 L502.501 7.487 Z" fill="#FFA800" />
      <Path
        d="M255.035,510.954c-3.413,0-5.973-1.707-7.68-5.12L-0.112,10.901c-1.707-3.413-0.853-6.827,1.707-9.387c3.413-2.56,7.68-3.413,10.24-0.853l130.56,85.333c4.267,2.56,5.12,7.68,2.56,11.947c-2.56,4.267-7.68,5.12-11.947,2.56L28.901,32.234l226.133,451.413l225.28-451.413L259.301,177.301c-2.56,1.707-6.827,1.707-9.387,0l-68.267-44.373c-4.267-2.56-5.12-7.68-2.56-11.947c2.56-4.267,7.68-5.12,11.947-2.56l64,41.813l243.2-159.573c3.413-1.707,7.68-1.707,10.24,0.853s3.413,5.973,1.707,9.387L262.715,505.834C261.008,509.247,258.448,510.954,255.035,510.954z"
        fill="#000000"
      />
      <Path
        d="M169.701,109.887c0-5.12-3.413-8.533-8.533-8.533c-5.12,0-8.533,3.413-8.533,8.533c0,5.12,3.413,8.533,8.533,8.533C166.288,118.421,169.701,115.007,169.701,109.887"
        fill="#000000"
      />
    </G>
  </Svg>
);

const SpinWheel = forwardRef<SpinWheelRef, SpinWheelProps>(function SpinWheel(
  {
    data,
    size = windowWidth * 0.9,
    wheelPhysics,
    knobComponent,
    onSpinEnd,
    textColor,
    textFontWeight,
    textSize,
    segmentBgColor,
    segmentStrokeColor = Neo.ink,
    segmentStrokeWidth = 2.5,
    segmentCornerRadius = 0,
    segmentPadAngle = 0.003,
    showResultText = true,
    showSpinButton = true,
    centerSpinButton = true,
    hubSoftShadow = false,
    hubLabelFontFamily,
    hubLabelColor = "#FFFBEB",
    hubRingBorderWidth = 0,
    hubRingBorderColor,
    labelFontFamily,
    /** Bulb-halo gradient on slice rims — only while winning; default false (black `segmentStrokeColor`). */
    prizeSliceVictoryShine = false,
    onSpinPress,
    spinLocked = false,
    hubMode = "spin",
    onHubClaimPress,
    sliceLabelMode = "text",
    sliceIconScale = 1,
    hubAnimSubtle = false,
    externalSpinControl = false,
    hubLoadEpoch = 0,
    onHubImageLoad,
    syncDiscScale: syncDiscScaleProp,
    onSlicePress,
    slicePressEnabled = true,
    onSpinInterrupted,
    stripPanGesture,
  },
  ref
) {
  const prizeRimGradId = useId().replace(/:/g, "");

  if (!data || data.length === 0) {
    throw new Error("SpinWheel: data prop is required");
  }

  const { angle, spin, spinToIndex, enabled, winnerIndex, lastRestAngleDeg, angleBySegment, angleOffset } =
    useSpinWheel(data.length, wheelPhysics, onSpinInterrupted);

  const wheelDegForLabels = lastRestAngleDeg ?? 0;

  const hubLabelScale = useRef(new Animated.Value(1)).current;
  const hubScrollY = useRef(new Animated.Value(0)).current;
  const showPlayIcon = hubMode === "spin" && enabled;
  const showPauseIcon = !enabled;
  const showScrollIcon = hubMode === "claim";

  useEffect(() => {
    if (!showSpinButton || !centerSpinButton) return;
    if (!showPlayIcon) {
      hubLabelScale.stopAnimation();
      hubLabelScale.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(hubLabelScale, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hubLabelScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => {
      anim.stop();
      hubLabelScale.setValue(1);
    };
  }, [centerSpinButton, hubLabelScale, showPlayIcon, showSpinButton]);

  useEffect(() => {
    if (!showSpinButton || !centerSpinButton) return;
    if (!showScrollIcon) {
      hubScrollY.stopAnimation();
      hubScrollY.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(hubScrollY, {
          toValue: 9,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(hubScrollY, {
          toValue: 0,
          duration: 520,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(280),
      ])
    );
    anim.start();
    return () => {
      anim.stop();
      hubScrollY.setValue(0);
    };
  }, [centerSpinButton, hubScrollY, showScrollIcon, showSpinButton]);

  const segmentSpan = useRef(new Animated.Value(angleBySegment)).current;
  useEffect(() => {
    segmentSpan.setValue(angleBySegment);
  }, [angleBySegment, segmentSpan]);

  /** 1 while spinning (pointer drags with rim); springs to 0 when idle so the tip settles upright. */
  const pointerWiggleMute = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      pointerWiggleMute.stopAnimation();
      pointerWiggleMute.setValue(1);
      return;
    }
    Animated.spring(pointerWiggleMute, {
      toValue: 0,
      useNativeDriver: true,
      friction: 10,
      tension: 21,
      overshootClamping: true,
    }).start();
  }, [enabled, pointerWiggleMute]);

  /** Spin-phase juice: rim pulse, slight disc lift, hub breathe (stopped cleanly when idle). */
  const spinRimOpacity = useRef(new Animated.Value(0)).current;
  const internalSpinDiscScale = useRef(new Animated.Value(1)).current;
  const spinDiscScale = syncDiscScaleProp ?? internalSpinDiscScale;
  const hubSpinScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (enabled) {
      spinRimOpacity.stopAnimation();
      spinDiscScale.stopAnimation();
      hubSpinScale.stopAnimation();
      Animated.parallel([
        Animated.timing(spinRimOpacity, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.spring(spinDiscScale, { toValue: 1, friction: 9, tension: 140, useNativeDriver: true }),
        Animated.spring(hubSpinScale, { toValue: 1, friction: 9, tension: 140, useNativeDriver: true }),
      ]).start();
      return;
    }
    spinRimOpacity.setValue(0.18);
    const rimLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(spinRimOpacity, {
          toValue: 0.46,
          duration: 540,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(spinRimOpacity, {
          toValue: 0.12,
          duration: 540,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const discLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(spinDiscScale, {
          toValue: 1.011,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(spinDiscScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const hubPeak = hubAnimSubtle ? 1.02 : 1.05;
    const hubDur = hubAnimSubtle ? 1100 : 900;
    const hubLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hubSpinScale, {
          toValue: hubPeak,
          duration: hubDur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hubSpinScale, {
          toValue: 1,
          duration: hubDur,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    rimLoop.start();
    discLoop.start();
    hubLoop.start();
    return () => {
      rimLoop.stop();
      discLoop.stop();
      hubLoop.stop();
    };
  }, [enabled, hubAnimSubtle, spinRimOpacity, spinDiscScale, hubSpinScale]);

  const showSliceText = sliceLabelMode === "text" || sliceLabelMode === "both";
  const showSliceIcons = sliceLabelMode === "icons" || sliceLabelMode === "both";

  /** Inner radius of the prize ring; smaller = slices extend closer to the hub. */
  const innerRadius = Math.max(32, Math.round(size * 0.118));
  /** Hub image: full inner opening plus slight overlap so it reads larger than the hole. */
  const hubDiameter = Math.round(innerRadius * 2 + 22);
  const hubPlayIconSize = Math.max(18, Math.round(hubDiameter * 0.38));
  const hubScrollIconSize = Math.max(22, Math.round(hubDiameter * 0.34));
  const hubPauseIconSize = Math.max(18, Math.round(hubDiameter * 0.34));
  const cornerR = segmentCornerRadius;

  const knobW = 36;
  const knobH = 46;
  /** Prize ring outer edge from top of box (matches arc `outerRadius`). */
  const discTopY = Math.round(size / 2 - (size / 2 - SPIN_WHEEL_PRIZE_RING_OUTER_INSET));
  /** Nudge above rim so the pointer sits on the colored circle (higher = closer to top). */
  const pointerTop = discTopY - Math.round(12 + size * 0.014);

  const arcs = useMemo(
    () => d3Shape.pie<SpinWheelItem>().value(() => 1)(data),
    [data]
  );
  const arcGenerator = useMemo(
    () =>
      d3Shape
        .arc<d3Shape.PieArcDatum<SpinWheelItem>>()
        .outerRadius(size / 2 - SPIN_WHEEL_PRIZE_RING_OUTER_INSET)
        .innerRadius(innerRadius)
        .cornerRadius(cornerR)
        .padAngle(segmentPadAngle),
    [cornerR, innerRadius, segmentPadAngle, size]
  );

  const labelPull = showSliceIcons && showSliceText ? 1.22 : 1.08;

  const iconPlacements = useMemo(() => {
    const pull = showSliceText ? 0.94 : 1.16;
    const rad = (-angleOffset * Math.PI) / 180;
    const half = size / 2;
    return arcs.map((arc) => {
      const [cx, cy] = arcGenerator.centroid(arc);
      const lx = cx * pull;
      const ly = cy * pull;
      const rx = lx * Math.cos(rad) - ly * Math.sin(rad);
      const ry = lx * Math.sin(rad) + ly * Math.cos(rad);
      return { x: half + rx, y: half + ry };
    });
  }, [angleOffset, arcGenerator, arcs, showSliceText, size]);

  const segmentProgress = Animated.modulo(
    Animated.divide(
      Animated.modulo(Animated.subtract(angle, angleOffset), ONE_TURN),
      segmentSpan
    ),
    1
  );

  const knobWiggleDeg = segmentProgress.interpolate({
    inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
    outputRange: [0, 0, 16, -16, 0, 0],
  });
  const knobRotation = Animated.multiply(knobWiggleDeg, pointerWiggleMute).interpolate({
    inputRange: [-18, 0, 18],
    outputRange: ["-18deg", "0deg", "18deg"],
    extrapolate: "clamp",
  });

  const handleSpin = () => {
    if (spinLocked) return;
    if (!enabled) return;
    runHapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    onSpinPress?.();
    if (externalSpinControl) return;
    spin((i) => {
      const item = data[i] ?? { id: String(i), label: "" };
      onSpinEnd?.(item, i);
    });
  };

  const handleHubPress = () => {
    if (hubMode === "claim") {
      runHapticImpact(Haptics.ImpactFeedbackStyle.Medium);
      onHubClaimPress?.();
      return;
    }
    handleSpin();
  };

  const hubPressable = hubMode === "claim" ? !spinLocked : enabled && !spinLocked;
  const hubOpacity = hubMode === "claim" ? 1 : spinLocked ? 0.45 : enabled ? 1 : 0.55;

  const driveSpinToIndex = (index: number) => {
    spinToIndex(
      index,
      (i) => {
        const item = data[i] ?? { id: String(i), label: "" };
        onSpinEnd?.(item, i);
      },
      true
    );
  };

  useImperativeHandle(ref, () => ({
    spin: handleSpin,
    // Parent-driven spins must not check `spinLocked` (UI may already show isSpinning).
    spinToIndex: driveSpinToIndex,
  }));

  useEffect(() => {
    if (!showSpinButton || !centerSpinButton) {
      onHubImageLoad?.(hubLoadEpoch);
    }
  }, [centerSpinButton, hubLoadEpoch, onHubImageLoad, showSpinButton]);

  const spinRotate = angle.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  const hubRingColor = hubRingBorderColor ?? segmentStrokeColor;
  const hubInkRing = (hubRingBorderWidth ?? 0) > 0;
  const sliceStrokePaint =
    prizeSliceVictoryShine === true ? `url(#${prizeRimGradId})` : segmentStrokeColor;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, position: "relative" }}>
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate: spinRotate }, { scale: spinDiscScale }],
            opacity: enabled ? 1 : 0.96,
          }}
        >
          <Svg width={size} height={size}>
            {prizeSliceVictoryShine ? (
              <Defs>
                <RadialGradient
                  id={prizeRimGradId}
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2}
                  fx={size / 2}
                  fy={size / 2}
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0%" stopColor={NeoBulbRingTheme.bulbHaloRimInnerSolid} stopOpacity={1} />
                  <Stop offset="58%" stopColor={NeoBulbRingTheme.bulbHot} stopOpacity={1} />
                  <Stop offset="100%" stopColor={NeoBulbRingTheme.bulbHaloRimOuterSolid} stopOpacity={1} />
                </RadialGradient>
              </Defs>
            ) : null}
            <G x={size / 2} y={size / 2} rotation={-angleOffset}>
              {arcs.map((arc, index) => {
                const [cx, cy] = arcGenerator.centroid(arc);
                const x = cx * labelPull;
                const y = cy * labelPull;
                let fillColor = "#d3d3b8";
                if (segmentBgColor) {
                  fillColor = Array.isArray(segmentBgColor)
                    ? segmentBgColor[index % segmentBgColor.length]
                    : segmentBgColor;
                }
                const d = arcGenerator(arc);
                if (!d) return null;
                const labelT = prizeUprightTransform(
                  x,
                  y,
                  arc.startAngle,
                  arc.endAngle,
                  wheelDegForLabels,
                  -angleOffset
                );
                return (
                  <G key={index}>
                    <Path
                      d={d}
                      fill={fillColor}
                      stroke={sliceStrokePaint}
                      strokeWidth={segmentStrokeWidth}
                      strokeLinejoin="miter"
                      strokeLinecap="butt"
                    />
                    {enabled && data[index].image ? (
                      <SvgImage
                        transform={labelT}
                        href={data[index].image as string}
                        x={x - 30}
                        y={y - 30}
                        width={60}
                        height={60}
                      />
                    ) : null}
                    {enabled && showSliceText && data[index].label ? (
                      <SvgText
                        transform={labelT}
                        x={x}
                        y={y}
                        fill={textColor ?? "rgba(18,18,22,0.95)"}
                        stroke="rgba(15, 23, 42, 0.2)"
                        strokeWidth={0.55}
                        fontSize={(textSize ?? 16) * 1.12}
                        fontWeight={labelFontFamily != null ? "400" : textFontWeight ?? "800"}
                        fontFamily={labelFontFamily}
                        letterSpacing={labelFontFamily != null ? 0.35 : 0}
                        textAnchor="middle"
                      >
                        {data[index].label}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
            </G>
          </Svg>
          {showSliceIcons ? (
            <SliceIconLayer
              size={size}
              data={data}
              placements={iconPlacements}
              iconScale={sliceIconScale}
            />
          ) : null}
          <SliceTouchLayer
            size={size}
            placements={iconPlacements}
            sliceCount={data.length}
            enabled={slicePressEnabled && onSlicePress != null}
            onSlicePress={onSlicePress}
          />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: segmentStrokeWidth,
            borderColor: segmentStrokeColor,
            opacity: spinRimOpacity,
            zIndex: 4,
          }}
        />

        {showSpinButton && centerSpinButton ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View
              style={{
                position: "absolute",
                left: (size - hubDiameter) / 2,
                top: (size - hubDiameter) / 2,
                width: hubDiameter,
                height: hubDiameter,
                transform: [{ scale: hubSpinScale }],
                zIndex: 25,
              }}
              pointerEvents="box-none"
            >
              <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                hubMode === "claim"
                  ? "Claim prize and go to next wheel"
                  : spinLocked
                    ? "Wheel not ready yet"
                    : enabled
                      ? "Spin the wheel"
                      : "Spinning"
              }
              accessibilityState={{
                busy: hubMode === "busy",
                disabled: !hubPressable,
              }}
              simultaneousWithExternalGesture={stripPanGesture}
              style={[
                StyleSheet.absoluteFillObject,
                styles.centerSpinBase,
                WEB_PRESSABLE_RESET,
                hubSoftShadow ? styles.centerSpinSoftShadow : null,
                hubInkRing
                  ? {
                      borderWidth: hubRingBorderWidth,
                      borderColor: hubRingColor,
                    }
                  : null,
                {
                  borderRadius: hubDiameter / 2,
                  backgroundColor: "transparent",
                  opacity: hubOpacity,
                },
              ]}
              onPress={handleHubPress}
              disabled={!hubPressable}
            >
              <Image
                key={`spin-hub-${hubLoadEpoch}`}
                source={SPIN_HUB_IMAGE}
                style={{
                  width: hubDiameter,
                  height: hubDiameter,
                  borderRadius: hubDiameter / 2,
                  opacity: hubMode === "busy" ? 0.88 : 1,
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
                onLoad={() => onHubImageLoad?.(hubLoadEpoch)}
                onError={() => onHubImageLoad?.(hubLoadEpoch)}
              />
              <View
                style={[StyleSheet.absoluteFillObject, styles.centerSpinLabelSlot]}
                pointerEvents="none"
              >
                <Animated.View
                  style={[
                    styles.centerSpinLabelWrap,
                    {
                      transform: [
                        { scale: showPlayIcon ? hubLabelScale : 1 },
                        { translateY: showScrollIcon ? hubScrollY : 0 },
                      ],
                      opacity: showPauseIcon ? 0.92 : showPlayIcon || showScrollIcon ? 1 : 0,
                    },
                  ]}
                >
                  {showScrollIcon ? (
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={hubScrollIconSize}
                      color={HUB_ICON_COLOR}
                    />
                  ) : showPauseIcon ? (
                    <MaterialCommunityIcons
                      name="pause"
                      size={hubPauseIconSize}
                      color={HUB_ICON_COLOR}
                    />
                  ) : showPlayIcon ? (
                    <MaterialCommunityIcons
                      name="play"
                      size={hubPlayIconSize}
                      color={HUB_ICON_COLOR}
                      style={styles.hubPlayIcon}
                    />
                  ) : null}
                </Animated.View>
              </View>
            </Pressable>
            </Animated.View>
          </View>
        ) : null}

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: (size - knobW) / 2,
            top: pointerTop,
            width: knobW,
            height: knobH,
            justifyContent: "flex-start",
            alignItems: "center",
            zIndex: 30,
            transform: [{ rotate: knobRotation }],
          }}
        >
          {knobComponent ?? <DefaultKnob width={36} height={36} />}
        </Animated.View>
      </View>

      {showSpinButton && !centerSpinButton ? (
        <Pressable
          style={[styles.buttonBelow, (!enabled || spinLocked) && { opacity: 0.5 }]}
          onPress={handleSpin}
          disabled={!enabled || spinLocked}
          simultaneousWithExternalGesture={stripPanGesture}
        >
          <RNText style={styles.buttonText}>Spin</RNText>
        </Pressable>
      ) : null}

      {showResultText ? (
        <RNText style={styles.result}>
          {winnerIndex !== null ? `Selected: ${data[winnerIndex].id}` : "Spin the wheel"}
        </RNText>
      ) : null}
    </View>
  );
});

export default memo(SpinWheel);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerSpinBase: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  centerSpinSoftShadow: {
    shadowColor: "rgba(15, 15, 20, 0.18)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  hubPlayIcon: {
    marginLeft: 2,
  },
  centerSpinLabelSlot: {
    justifyContent: "center",
    alignItems: "center",
  },
  centerSpinLabelWrap: {
    minHeight: 34,
    minWidth: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonBelow: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#FFD200",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  result: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
});
