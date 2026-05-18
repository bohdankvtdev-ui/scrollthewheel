import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PIT_STOP_OPTIONS } from "../../game/tactics/cyclePitStop";
import { useRunStore } from "../../stores/runStore";

type CyclePitStopOverlayProps = {
  onPicked: () => void;
};

export function CyclePitStopOverlay({ onPicked }: CyclePitStopOverlayProps) {
  const applyPitStop = useRunStore((s) => s.applyPitStop);

  return (
    <View style={styles.backdrop}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.scrim} />
      <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.card}>
        <Text style={[styles.headline, { fontFamily: FONT_BEBAS_NEUE }]}>Pit stop</Text>
        <Text style={styles.sub}>Pick one bonus before cycle rewards</Text>
        <View style={styles.options}>
          {PIT_STOP_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={styles.option}
              onPress={() => {
                applyPitStop(opt.id);
                onPicked();
              }}
            >
              <MaterialCommunityIcons
                name={opt.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={28}
                color={Neo.neonCyan}
              />
              <Text style={[styles.optTitle, { fontFamily: FONT_BEBAS_NEUE }]}>{opt.title}</Text>
              <Text style={styles.optLine}>{opt.line}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.footer}>
          <MaterialIcons name="info-outline" size={16} color="rgba(250,250,250,0.5)" />
          <Text style={styles.footerText}>Choose wisely — one pick only</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 210,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1A1228",
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    padding: 20,
    gap: 12,
  },
  headline: {
    fontSize: 28,
    color: Neo.neonYellow,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: "rgba(250,250,250,0.7)",
    textAlign: "center",
  },
  options: {
    gap: 10,
  },
  option: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: Neo.borderThin,
    borderColor: "rgba(34,211,238,0.4)",
  },
  optTitle: {
    fontSize: 18,
    color: Neo.textOnDark,
  },
  optLine: {
    fontSize: 13,
    color: "rgba(250,250,250,0.6)",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(250,250,250,0.5)",
  },
});
