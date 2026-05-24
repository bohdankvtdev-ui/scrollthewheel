import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import {
  homeBodyOnDark,
  homeBrutalButton,
  homeBrutalCard,
  homeKickerStyle,
  HomePalette,
  HomeScreenTheme as T,
} from "../../../theme/homeScreen";
import type { HomeResumeSnapshot } from "../../hooks/useHomeScreen";
import { formatMoney } from "../../utils/formatMoney";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const NEW_RUN_RED = "#EF4444";

type HomeActionsProps = {
  resume: HomeResumeSnapshot | null;
  onContinue: () => void;
  onNewRun: () => void;
};

function ResumeChip({ snapshot }: { snapshot: HomeResumeSnapshot }) {
  return (
    <View style={styles.resumeChip}>
      <Text style={[styles.resumeMeta, { fontFamily: FONT_BEBAS_NEUE }]}>
        Saved · C{snapshot.cycle} · W{snapshot.wheelIndex + 1}/{snapshot.wheelTotal}
      </Text>
      <Text style={[styles.resumeMoney, { fontFamily: FONT_BEBAS_NEUE }]}>
        {formatMoney(snapshot.money)}
      </Text>
    </View>
  );
}

export function HomeActions({ resume, onContinue, onNewRun }: HomeActionsProps) {
  const hasResume = resume != null;
  const pressContinue = useSharedValue(0);
  const pressNew = useSharedValue(0);

  const continueAnim = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressContinue.value * 4 },
      { translateY: pressContinue.value * 4 },
    ],
    shadowOffset: {
      width: T.shadowHard.width - pressContinue.value * 4,
      height: T.shadowHard.height - pressContinue.value * 4,
    },
  }));

  const newRunAnim = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressNew.value * 4 },
      { translateY: pressNew.value * 4 },
    ],
    shadowOffset: {
      width: T.shadowHard.width - pressNew.value * 4,
      height: T.shadowHard.height - pressNew.value * 4,
    },
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(60).springify()}
      style={[homeBrutalCard(T.panelDark), styles.block]}
    >
      <Text style={[styles.section, homeKickerStyle(), { fontFamily: FONT_BEBAS_NEUE }]}>
        {hasResume ? "Pick up" : "Play"}
      </Text>

      {hasResume && resume != null ? (
        <ResumeChip snapshot={resume} />
      ) : (
        <Text style={[styles.hint, homeBodyOnDark(), { fontFamily: FONT_BEBAS_NEUE }]}>
          9 wheels · shop · don&apos;t hit $0
        </Text>
      )}

      {hasResume ? (
        <>
          <AnimatedPressable
            style={[homeBrutalButton(T.continue), styles.btn, continueAnim]}
            onPress={onContinue}
            onPressIn={() => {
              pressContinue.value = withSpring(1, { damping: 18, stiffness: 380 });
            }}
            onPressOut={() => {
              pressContinue.value = withSpring(0, { damping: 16, stiffness: 300 });
            }}
            accessibilityRole="button"
            accessibilityLabel="Continue run"
          >
            <Text style={[styles.btnLabelLight, { fontFamily: FONT_BEBAS_NEUE }]}>Continue run</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={[homeBrutalButton(NEW_RUN_RED), styles.btnSecondary, newRunAnim]}
            onPress={onNewRun}
            onPressIn={() => {
              pressNew.value = withSpring(1, { damping: 20, stiffness: 400 });
            }}
            onPressOut={() => {
              pressNew.value = withSpring(0, { damping: 18, stiffness: 320 });
            }}
            accessibilityRole="button"
            accessibilityLabel="Start new run"
          >
            <Text style={[styles.btnLabelLight, { fontFamily: FONT_BEBAS_NEUE }]}>New run</Text>
          </AnimatedPressable>
        </>
      ) : (
        <AnimatedPressable
          style={[homeBrutalButton(NEW_RUN_RED), styles.btn, newRunAnim]}
          onPress={onNewRun}
          onPressIn={() => {
            pressNew.value = withSpring(1, { damping: 18, stiffness: 380 });
          }}
          onPressOut={() => {
            pressNew.value = withSpring(0, { damping: 16, stiffness: 300 });
          }}
          accessibilityRole="button"
          accessibilityLabel="Start run"
        >
          <Text style={[styles.btnLabelLight, { fontFamily: FONT_BEBAS_NEUE }]}>Start run</Text>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 12,
  },
  section: {},
  hint: {
    fontSize: 15,
    marginBottom: 2,
  },
  resumeChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  resumeMeta: {
    flex: 1,
    fontSize: 11,
    color: "rgba(250,250,250,0.55)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  resumeMoney: {
    fontSize: 20,
    color: T.textOnDark,
    letterSpacing: 0.3,
  },
  btn: {
    minHeight: 56,
    paddingVertical: 14,
  },
  btnSecondary: {
    minHeight: 50,
    paddingVertical: 12,
  },
  btnLabelLight: {
    fontSize: 20,
    color: "#FAFAFA",
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },
});
