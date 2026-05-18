import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Polygon } from "react-native-svg";
import * as d3Shape from "d3-shape";
import { Neo, NeoWheel } from "../../../theme/neoBrutal";

const SEGMENTS = Neo.segmentColors.length;
const SIZE = 196;

/** Static decorative wheel — not the app logo. */
export const HomeWheelDeco = memo(function HomeWheelDeco() {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outer = SIZE / 2 - 10;
  const inner = outer * 0.36;
  const arcs = d3Shape.pie<number>().value(() => 1)(Array.from({ length: SEGMENTS }, (_, i) => i));
  const arcGen = d3Shape
    .arc<d3Shape.PieArcDatum<number>>()
    .outerRadius(outer)
    .innerRadius(inner)
    .padAngle(0.025)
    .cornerRadius(3);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={SIZE} height={SIZE + 8} viewBox={`0 0 ${SIZE} ${SIZE + 8}`}>
        <Polygon
          points={`${cx - 12},14 ${cx + 12},14 ${cx},34`}
          fill={Neo.neonYellow}
          stroke={Neo.ink}
          strokeWidth={2.5}
        />
        <G x={cx} y={cy + 4}>
          {arcs.map((arc, i) => (
            <Path
              key={i}
              d={arcGen(arc) ?? undefined}
              fill={Neo.segmentColors[i % Neo.segmentColors.length]}
              stroke={Neo.ink}
              strokeWidth={2.5}
            />
          ))}
          <Circle
            r={inner - 5}
            fill={NeoWheel.hubBackground}
            stroke={Neo.ink}
            strokeWidth={2.5}
          />
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE + 8,
    alignItems: "center",
    marginBottom: 4,
  },
});
