import { Neo } from "../../../theme/neoBrutal";
import Svg, { Polygon } from "react-native-svg";
import { View } from "react-native";

const INK = "#0A0A0A";

/**
 * Neo-brutalist pointer — tip points **down** toward the rim (wide top, apex low). Matches `SpinWheel` 36×46 slot.
 */
export function NeoKnob() {
  return (
    <View style={{ width: 36, height: 46, justifyContent: "flex-start", alignItems: "center" }}>
      <Svg width={32} height={40} viewBox="0 0 32 40">
        <Polygon
          points="2,2 30,2 16,36"
          fill={Neo.accent}
          stroke={INK}
          strokeWidth={2.1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Polygon
          points="6,3 26,3 16,29"
          fill="#FFFBEB"
          stroke={INK}
          strokeWidth={1.55}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
