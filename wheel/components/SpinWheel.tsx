import React, { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Defs, G, Image as SvgImage, Path, RadialGradient, Stop, Text as SvgText } from "react-native-svg";
import * as d3Shape from "d3-shape";
import { SPIN_WHEEL_PRIZE_RING_OUTER_INSET } from "../../lib/layout/wheelFrame";
import { NeoBulbRingTheme } from "../../theme/neoBrutal";
import { useSpinWheel } from "../hooks/useSpinWheel";
import type { SpinWheelItem, SpinWheelProps, SpinWheelRef } from "../types";

const windowWidth = Dimensions.get("window").width;
const ONE_TURN = 360;

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
    segmentStrokeColor = "rgba(18, 18, 22, 0.92)",
    segmentStrokeWidth = 2,
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
    hubLoadEpoch = 0,
    onHubImageLoad,
  },
  ref
) {
  const prizeRimGradId = useId().replace(/:/g, "");

  if (!data || data.length === 0) {
    throw new Error("SpinWheel: data prop is required");
  }

  const { angle, spin, enabled, winnerIndex, angleBySegment, angleOffset } = useSpinWheel(
    data.length,
    wheelPhysics
  );

  const hubLabelScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!showSpinButton || !centerSpinButton) return;
    if (!enabled) {
      hubLabelScale.stopAnimation();
      hubLabelScale.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(hubLabelScale, {
          toValue: 1.06,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hubLabelScale, {
          toValue: 1,
          duration: 1300,
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
  }, [centerSpinButton, enabled, hubLabelScale, showSpinButton]);

  const segmentSpan = useRef(new Animated.Value(angleBySegment)).current;
  useEffect(() => {
    segmentSpan.setValue(angleBySegment);
  }, [angleBySegment, segmentSpan]);

  /** Inner radius of the prize ring; smaller = slices extend closer to the hub. */
  const innerRadius = Math.max(32, Math.round(size * 0.118));
  /** Hub image: full inner opening plus slight overlap so it reads larger than the hole. */
  const hubDiameter = Math.round(innerRadius * 2 + 22);
  const cornerR = segmentCornerRadius;

  const knobW = 36;
  const knobH = 46;
  /** Prize ring outer edge from top of box (matches arc `outerRadius`). */
  const discTopY = Math.round(size / 2 - (size / 2 - SPIN_WHEEL_PRIZE_RING_OUTER_INSET));
  /** Nudge above rim so the pointer sits on the colored circle (higher = closer to top). */
  const pointerTop = discTopY - Math.round(12 + size * 0.014);

  const arcs = d3Shape.pie<SpinWheelItem>().value(() => 1)(data);
  const arcGenerator = d3Shape
    .arc<d3Shape.PieArcDatum<SpinWheelItem>>()
    .outerRadius(size / 2 - SPIN_WHEEL_PRIZE_RING_OUTER_INSET)
    .innerRadius(innerRadius)
    .cornerRadius(cornerR)
    .padAngle(segmentPadAngle);

  const segmentProgress = Animated.modulo(
    Animated.divide(
      Animated.modulo(Animated.subtract(angle, angleOffset), ONE_TURN),
      segmentSpan
    ),
    1
  );

  const knobRotation = segmentProgress.interpolate({
    inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
    outputRange: ["0deg", "0deg", "26deg", "-26deg", "0deg", "0deg"],
  });

  const handleSpin = () => {
    if (spinLocked) return;
    if (!enabled) return;
    onSpinPress?.();
    spin((i) => onSpinEnd?.(data[i], i));
  };

  useImperativeHandle(ref, () => ({
    spin: handleSpin,
  }));

  useEffect(() => {
    if (!showSpinButton || !centerSpinButton) {
      onHubImageLoad?.(hubLoadEpoch);
    }
  }, [centerSpinButton, hubLoadEpoch, onHubImageLoad, showSpinButton]);

  const spinRotate = angle.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ["-360deg", "0deg", "360deg"],
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
            transform: [{ rotate: spinRotate }],
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
                const labelPull = 1.08;
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
                    {data[index].image ? (
                      <SvgImage
                        href={data[index].image as string}
                        x={x - 30}
                        y={y - 30}
                        width={60}
                        height={60}
                      />
                    ) : data[index].label ? (
                      <SvgText
                        x={x}
                        y={y}
                        fill={textColor ?? "rgba(18,18,22,0.95)"}
                        stroke="rgba(15, 23, 42, 0.28)"
                        strokeWidth={0.65}
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
        </Animated.View>

        {showSpinButton && centerSpinButton ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                spinLocked ? "Wheel not ready yet" : enabled ? "Spin the wheel" : "Spinning"
              }
              accessibilityState={{ busy: !enabled, disabled: spinLocked || !enabled }}
              style={[
                styles.centerSpinBase,
                hubSoftShadow ? styles.centerSpinSoftShadow : null,
                hubInkRing
                  ? {
                      borderWidth: hubRingBorderWidth,
                      borderColor: hubRingColor,
                    }
                  : null,
                {
                  width: hubDiameter,
                  height: hubDiameter,
                  borderRadius: hubDiameter / 2,
                  left: (size - hubDiameter) / 2,
                  top: (size - hubDiameter) / 2,
                  backgroundColor: "transparent",
                  opacity: spinLocked ? 0.45 : enabled ? 1 : 0.55,
                },
              ]}
              onPress={handleSpin}
              disabled={!enabled || spinLocked}
              activeOpacity={0.88}
            >
              <Image
                key={`spin-hub-${hubLoadEpoch}`}
                source={SPIN_HUB_IMAGE}
                style={{
                  width: hubDiameter,
                  height: hubDiameter,
                  borderRadius: hubDiameter / 2,
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
                onLoad={() => onHubImageLoad?.(hubLoadEpoch)}
                onError={() => onHubImageLoad?.(hubLoadEpoch)}
              />
              <View
                style={[StyleSheet.absoluteFillObject, styles.centerSpinLabelWrap]}
                pointerEvents="none"
              >
                <Animated.View style={{ transform: [{ scale: hubLabelScale }] }}>
                  <RNText
                    style={[
                      styles.centerSpinTextOnImage,
                      {
                        ...(hubLabelFontFamily != null ? { fontFamily: hubLabelFontFamily } : {}),
                        color: hubLabelColor,
                        fontWeight: hubLabelFontFamily != null ? "400" : "900",
                        letterSpacing: hubLabelFontFamily != null ? 0.9 : 0.45,
                      },
                    ]}
                  >
                    {enabled ? "Spin" : ""}
                  </RNText>
                </Animated.View>
              </View>
            </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.buttonBelow, (!enabled || spinLocked) && { opacity: 0.5 }]}
          onPress={handleSpin}
          disabled={!enabled || spinLocked}
        >
          <RNText style={styles.buttonText}>Spin</RNText>
        </TouchableOpacity>
      ) : null}

      {showResultText ? (
        <RNText style={styles.result}>
          {winnerIndex !== null ? `Selected: ${data[winnerIndex].id}` : "Spin the wheel"}
        </RNText>
      ) : null}
    </View>
  );
});

export default SpinWheel;

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
  centerSpinTextOnImage: {
    fontSize: 30,
    textAlign: "center",
  },
  centerSpinLabelWrap: {
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
