import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { WheelArchetype } from "../../game/wheels/types";
import { getWheelArchetypeMeta } from "../../data/wheelArchetypeMeta";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { EffectIcon } from "./EffectIcon";

type WheelRoleBannerProps = {
  archetype: WheelArchetype;
  floor: number;
};

export function WheelRoleBanner({ archetype, floor }: WheelRoleBannerProps) {
  const meta = getWheelArchetypeMeta(archetype);

  return (
    <View style={styles.wrap}>
      <EffectIcon
        icon={meta.icon}
        iconFamily={meta.iconFamily}
        effectHint={meta.hint}
        size="lg"
        accentBg={meta.accent}
      />
      <View style={styles.tags}>
        <View style={[styles.pill, { backgroundColor: meta.accent }]}>
          <Text style={[styles.pillText, { fontFamily: FONT_BEBAS_NEUE }]}>{meta.tag}</Text>
        </View>
        <View style={styles.pillMuted}>
          <MaterialIcons name="autorenew" size={13} color={Neo.textOnDark} />
          <Text style={[styles.pillTextMuted, { fontFamily: FONT_BEBAS_NEUE }]}>Cycle {floor}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  pill: {
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  pillText: {
    fontSize: 13,
    color: Neo.ink,
    letterSpacing: 0.4,
  },
  pillTextMuted: {
    fontSize: 13,
    color: Neo.textOnDark,
    letterSpacing: 0.4,
  },
});
