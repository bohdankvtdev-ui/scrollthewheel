import { StyleSheet, View } from "react-native";
import { HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";

/** Run-dark field + soft neons (coins + wheels live in HomeHeroStage). */
export function HomeBackdrop() {
  return (
    <View style={styles.root} pointerEvents="none">
      <View style={styles.base} />
      <View style={[styles.glow, { backgroundColor: `${HomePalette.ring}30` }]} />
      <View style={[styles.glowB, { backgroundColor: `${HomePalette.cyan}20` }]} />
      <View style={[styles.glowC, { backgroundColor: `${HomePalette.magenta}14` }]} />
      <View style={[styles.glowGreen, { backgroundColor: `${HomePalette.green}22` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.background,
  },
  glow: {
    position: "absolute",
    width: 380,
    height: 380,
    top: "18%",
    right: -120,
    borderRadius: 190,
  },
  glowB: {
    position: "absolute",
    width: 320,
    height: 320,
    bottom: "12%",
    left: -100,
    borderRadius: 160,
  },
  glowC: {
    position: "absolute",
    width: 260,
    height: 260,
    top: "32%",
    left: "28%",
    borderRadius: 130,
  },
  glowGreen: {
    position: "absolute",
    width: 300,
    height: 300,
    top: "24%",
    right: "8%",
    borderRadius: 150,
  },
});
