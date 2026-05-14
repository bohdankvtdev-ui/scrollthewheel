import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { Neo, FONT_BEBAS_NEUE, neoAppHeaderPrize, neoAppHeaderStyle } from "../../../theme/neoBrutal";

type Props = {
  /** Running total of won/claimed prizes (e.g. "$150"). */
  totalLine: string | null;
  /** Most recent spin result label. */
  latestLine: string | null;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Neo-brutal accent for the thick header bottom edge */
  headerStripeColor?: string;
};

export function CashSpinAppHeader({
  totalLine,
  latestLine,
  onLayout,
  headerStripeColor = Neo.neonYellow,
}: Props) {
  const hasTotal = totalLine != null && totalLine.trim().length > 0 && totalLine.trim() !== "—";
  const hasLatest = latestLine != null && latestLine.trim().length > 0;

  const headerChrome: ViewStyle = {
    borderBottomWidth: Neo.borderBold + 2,
    borderBottomColor: headerStripeColor,
  };

  return (
    <View style={[neoAppHeaderStyle(), headerChrome]} onLayout={onLayout}>
      <Text style={styles.kicker} numberOfLines={1}>
        CASH · REELS
      </Text>
      <Text
        style={[
          neoAppHeaderPrize(),
          { fontSize: 20, lineHeight: 25 },
          !hasTotal ? { color: Neo.headerTextMuted } : null,
        ]}
        numberOfLines={1}
      >
        {hasTotal ? `Σ ${totalLine.trim()}` : "Σ —"}
      </Text>
      <Text
        style={[
          neoAppHeaderPrize(),
          { marginTop: 4, fontSize: 24, lineHeight: 28 },
          !hasLatest ? { color: Neo.headerTextMuted } : null,
        ]}
        numberOfLines={2}
      >
        {hasLatest ? latestLine.trim() : "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: FONT_BEBAS_NEUE,
    fontSize: 15,
    fontWeight: "400",
    color: Neo.headerTextMuted,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
});
