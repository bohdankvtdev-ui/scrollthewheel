import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import type { IconFamily } from "../../src/schemas";

type VectorIconProps = {
  name: string;
  size: number;
  color: string;
  family?: IconFamily;
};

function inGlyphMap(
  set: typeof MaterialIcons | typeof MaterialCommunityIcons | typeof Ionicons,
  name: string
): boolean {
  return name in set.glyphMap;
}

/** Renders an Expo vector icon, resolving family from glyph maps when needed. */
export function VectorIcon({ name, size, color, family }: VectorIconProps) {
  const order: IconFamily[] =
    family != null
      ? family === "MaterialCommunityIcons"
        ? ["MaterialCommunityIcons", "MaterialIcons", "Ionicons"]
        : family === "Ionicons"
          ? ["Ionicons", "MaterialCommunityIcons", "MaterialIcons"]
          : ["MaterialIcons", "MaterialCommunityIcons", "Ionicons"]
      : ["MaterialCommunityIcons", "MaterialIcons", "Ionicons"];

  for (const f of order) {
    if (f === "MaterialCommunityIcons" && inGlyphMap(MaterialCommunityIcons, name)) {
      return (
        <MaterialCommunityIcons
          name={name as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size}
          color={color}
        />
      );
    }
    if (f === "MaterialIcons" && inGlyphMap(MaterialIcons, name)) {
      return (
        <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={size} color={color} />
      );
    }
    if (f === "Ionicons" && inGlyphMap(Ionicons, name)) {
      return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
    }
  }

  return <MaterialIcons name="help-outline" size={size} color={color} />;
}
