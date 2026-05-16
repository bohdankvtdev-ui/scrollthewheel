import type { LayoutChangeEvent, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Neo, FONT_BEBAS_NEUE } from "../../../theme/neoBrutal";
import { NeoBrutalBlurPlate } from "./NeoBrutalBlurPlate";

type Props = {
  /** Running total of won/claimed prizes (e.g. "$150"). */
  totalLine: string | null;
  /** Most recent spin result label. */
  latestLine: string | null;
  /** e.g. `REEL 1 · 6` — ties HUD to reel progress. */
  reelProgressLine?: string | null;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Accent from current page theme (synced on reel advance). */
  headerStripeColor?: string;
};

export function CashSpinAppHeader({
  totalLine,
  latestLine,
  reelProgressLine,
  onLayout,
  headerStripeColor = Neo.neonYellow,
}: Props) {
  const hasTotal = totalLine != null && totalLine.trim().length > 0 && totalLine.trim() !== "—";
  const hasLatest = latestLine != null && latestLine.trim().length > 0;
  const showReel = reelProgressLine != null && reelProgressLine.trim().length > 0;

  const stripeTab = (extra: TextStyle = {}): TextStyle => ({
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 9,
    fontWeight: "400",
    letterSpacing: 1.15,
    color: headerStripeColor,
    opacity: 0.98,
    ...extra,
  });

  const valueInk: TextStyle = {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0.35,
    color: Neo.ink,
  };

  const mutedInk: TextStyle = {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.25,
    color: Neo.inkMuted,
  };

  const chipPad: ViewStyle = {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    flexShrink: 0,
  };

  return (
    <View
      style={[
        styles.strip,
        {
          borderBottomColor: headerStripeColor,
        },
      ]}
      onLayout={onLayout}
    >
      <View style={styles.row}>
        <NeoBrutalBlurPlate accent={headerStripeColor} style={styles.cellGrow} contentStyle={chipPad}>
          <MaterialIcons name="account-balance-wallet" size={17} color={Neo.ink} />
          <View style={styles.cellText}>
            <Text style={stripeTab()} numberOfLines={1}>
              TOTAL
            </Text>
            <Text style={[valueInk, !hasTotal && mutedInk]} numberOfLines={1}>
              {hasTotal ? `Σ ${totalLine.trim()}` : "Σ —"}
            </Text>
          </View>
        </NeoBrutalBlurPlate>

        {showReel ? (
          <View
            accessibilityRole="text"
            accessibilityLabel={`Current reel ${reelProgressLine}`}
            style={styles.cellMid}
          >
            <NeoBrutalBlurPlate accent={headerStripeColor} style={styles.cellMidFill} contentStyle={chipPad}>
              <MaterialIcons name="slow-motion-video" size={17} color={Neo.ink} />
              <Text style={[styles.reelText, { color: Neo.ink }]} numberOfLines={1}>
                {reelProgressLine!.trim().replace(/^REEL\s+/i, "")}
              </Text>
            </NeoBrutalBlurPlate>
          </View>
        ) : null}

        <NeoBrutalBlurPlate accent={headerStripeColor} style={styles.cellGrow} contentStyle={chipPad}>
          <MaterialIcons name="stars" size={17} color={Neo.ink} />
          <View style={styles.cellText}>
            <Text style={stripeTab()} numberOfLines={1}>
              LAST
            </Text>
            <Text style={[valueInk, !hasLatest && mutedInk]} numberOfLines={1}>
              {hasLatest ? latestLine!.trim() : "—"}
            </Text>
          </View>
        </NeoBrutalBlurPlate>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: Neo.borderThin,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },
  cellGrow: {
    flex: 1,
    minWidth: 0,
  },
  cellMid: {
    flexShrink: 0,
    maxWidth: "34%",
  },
  cellMidFill: {
    flex: 1,
    width: "100%",
    minWidth: 0,
  },
  cellText: {
    flex: 1,
    minWidth: 0,
  },
  reelText: {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
});
