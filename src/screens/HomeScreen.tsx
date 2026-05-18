import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Neo, neoPrimaryButtonStyle, neoSubtitleOnDark, neoTitleOnDark } from "../../theme/neoBrutal";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { useMetaStore } from "../stores/metaStore";
import { formatMoney } from "../utils/formatMoney";

export function HomeScreen() {
  const router = useRouter();
  const bestFloor = useMetaStore((s) => s.bestFloor);
  const bestPeakMoney = useMetaStore((s) => s.bestPeakMoney ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.inner}>
        <Text style={[styles.logo, { fontFamily: FONT_BEBAS_NEUE }]}>SpinWheel</Text>
        <Text style={neoSubtitleOnDark(16)}>Pick your run</Text>

        {(bestFloor > 0 || bestPeakMoney > 0) ? (
          <View style={styles.records}>
            {bestPeakMoney > 0 ? (
              <Text style={styles.recordLine}>Best bank {formatMoney(bestPeakMoney)}</Text>
            ) : null}
            {bestFloor > 0 ? (
              <Text style={styles.recordLine}>Best cycle {bestFloor}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnRun, neoPrimaryButtonStyle(pressed)]}
            onPress={() => router.push("/run")}
          >
            <MaterialCommunityIcons name="sword-cross" size={26} color={Neo.ink} />
            <View style={styles.btnTextWrap}>
              <Text style={[styles.btnTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Roguelike Run</Text>
              <Text style={styles.btnSub}>9 wheels · $0 = game over · chip shop</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnDesign, neoPrimaryButtonStyle(pressed)]}
            onPress={() => router.push("/design")}
          >
            <MaterialIcons name="data-object" size={24} color={Neo.ink} />
            <View style={styles.btnTextWrap}>
              <Text style={[styles.btnTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Game data</Text>
              <Text style={styles.btnSub}>Wheels, prizes, infinite scaling</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Neo.pageBg,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  logo: {
    ...neoTitleOnDark(48),
    letterSpacing: 1,
  },
  records: {
    marginTop: 8,
    gap: 4,
    alignItems: "center",
  },
  recordLine: {
    fontSize: 14,
    color: "rgba(250,250,250,0.72)",
    fontFamily: FONT_BEBAS_NEUE,
    letterSpacing: 0.4,
  },
  buttons: {
    width: "100%",
    maxWidth: 360,
    marginTop: 28,
    gap: 16,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  btnRun: {
    backgroundColor: Neo.neonCyan,
  },
  btnDesign: {
    backgroundColor: "#EDE9FE",
  },
  btnTextWrap: {
    flex: 1,
    gap: 2,
  },
  btnTitle: {
    fontSize: 22,
    color: Neo.ink,
    letterSpacing: 0.4,
  },
  btnSub: {
    fontSize: 13,
    color: Neo.inkMuted,
    fontFamily: FONT_BEBAS_NEUE,
    letterSpacing: 0.3,
  },
});
