import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import type { WheelArchetypeMeta } from "../../data/wheelArchetypeMeta";
import { Neo } from "../../../theme/neoBrutal";

type WheelMapIconProps = {
  meta: WheelArchetypeMeta;
  size?: number;
  color?: string;
};

export function WheelMapIcon({ meta, size = 14, color = Neo.ink }: WheelMapIconProps) {
  if (meta.iconFamily === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={meta.icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }
  return <MaterialIcons name={meta.icon as keyof typeof MaterialIcons.glyphMap} size={size} color={color} />;
}
