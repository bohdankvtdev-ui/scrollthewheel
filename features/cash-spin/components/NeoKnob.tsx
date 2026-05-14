import { Neo } from "../../../theme/neoBrutal";
import Svg, { Polygon } from "react-native-svg";
import { View } from "react-native";

const POINTER_STROKE = "#0A0A0A";

/**
 * Compact pointer sitting inside the wheel disc (apex toward center).
 */
export function NeoKnob() {
  return (
    <View style={{ width: 36, height: 46, justifyContent: "flex-start", alignItems: "center" }}>
      <Svg width={32} height={40} viewBox="0 0 32 40">
        <Polygon
          points="2,2 30,2 16,36"
          fill={Neo.accent}
          stroke={POINTER_STROKE}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Polygon
          points="6,3 26,3 16,29"
          fill="#FFFBEB"
          stroke={POINTER_STROKE}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
