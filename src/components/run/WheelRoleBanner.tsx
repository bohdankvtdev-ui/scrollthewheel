import { StyleSheet, Text, View } from "react-native";
import { WHEEL_ROLE_META } from "../../data/wheelRoleMeta";
import type { WheelRole } from "../../schemas";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { EffectIcon } from "./EffectIcon";

type WheelRoleBannerProps = {
  role: WheelRole;
  floor: number;
};

export function WheelRoleBanner({ role, floor }: WheelRoleBannerProps) {
  const meta = WHEEL_ROLE_META[role];

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
          <Text style={[styles.pillTextMuted, { fontFamily: FONT_BEBAS_NEUE }]}>F{floor}</Text>
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
  pillBoss: {
    backgroundColor: Neo.accent,
  },
  pillMuted: {
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
