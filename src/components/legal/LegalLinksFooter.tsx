import { StyleSheet, Text, View } from "react-native";
import { legalLinksExcept } from "../../constants/legalLinks";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { LegalLinkRow } from "./LegalLinkRow";

type LegalLinksFooterProps = {
  /** Hide link with this id (e.g. `privacy` on web). */
  excludeId?: string;
  /** Hide in-app route (e.g. `/credits`). */
  excludeRoute?: string;
  title?: string;
};

export function LegalLinksFooter({
  excludeId,
  excludeRoute,
  title = "More legal & info",
}: LegalLinksFooterProps) {
  const links = legalLinksExcept({ excludeId, excludeRoute });
  if (links.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>{title}</Text>
      <View style={styles.list}>
        {links.map((item) => (
          <LegalLinkRow key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 10,
  },
  title: {
    fontSize: 16,
    color: Neo.textOnDark,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  list: {
    gap: 8,
  },
});
