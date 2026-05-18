import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PERK_CATALOG } from "../../data/perks";
import { PERK_TIER_LABELS } from "../../game/gdd";
import { getPerkDisplay } from "../../game/perks/perkDisplay";
import { PERK_FAMILY_COLORS, PERK_FAMILY_LABELS } from "../../game/perks/perkFamilies";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { IconFamily } from "../../schemas";

type PerkDetailSheetProps = {
  perkId: string | null;
  visible: boolean;
  onClose: () => void;
};

function Glyph({
  family,
  name,
  color,
}: {
  family: IconFamily;
  name: string;
  color: string;
}) {
  if (family === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={40}
        color={color}
      />
    );
  }
  return (
    <MaterialIcons
      name={name as keyof typeof MaterialIcons.glyphMap}
      size={40}
      color={color}
    />
  );
}

export function PerkDetailSheet({ perkId, visible, onClose }: PerkDetailSheetProps) {
  const perk = perkId != null ? PERK_CATALOG[perkId] : null;
  const display = perkId != null ? getPerkDisplay(perkId) : null;
  if (perk == null) return null;

  const colors = PERK_FAMILY_COLORS[perk.family];
  const categoryLabel = PERK_FAMILY_LABELS[perk.family];
  const bullets = display?.bullets ?? [perk.description];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
            <Glyph family={perk.iconFamily} name={perk.icon} color={colors.accent} />
          </View>

          <Text style={[styles.name, { fontFamily: FONT_BEBAS_NEUE }]}>{perk.name}</Text>
          {perk.tagline.length > 0 ? (
            <Text style={styles.tagline}>{perk.tagline}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.tier, { fontFamily: FONT_BEBAS_NEUE }]}>
              {PERK_TIER_LABELS[perk.tier]}
            </Text>
            <Text style={[styles.category, { backgroundColor: colors.bg, color: colors.accent }]}>
              {categoryLabel}
            </Text>
          </View>

          <View style={styles.bulletBox}>
            <Text style={[styles.bulletHeading, { fontFamily: FONT_BEBAS_NEUE }]}>How it works</Text>
            {bullets.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeLbl, { fontFamily: FONT_BEBAS_NEUE }]}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFBEB",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: Neo.radiusCard,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 26,
    color: Neo.ink,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  tagline: {
    fontSize: 15,
    color: "rgba(0,0,0,0.55)",
    textAlign: "center",
    marginTop: -2,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  tier: {
    fontSize: 13,
    color: Neo.ink,
    backgroundColor: Neo.neonYellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  category: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    overflow: "hidden",
  },
  bulletBox: {
    width: "100%",
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(0,0,0,0.12)",
    gap: 6,
  },
  bulletHeading: {
    fontSize: 13,
    color: Neo.ink,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
    color: Neo.ink,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Neo.ink,
  },
  closeBtn: {
    marginTop: 10,
    backgroundColor: Neo.ink,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 11,
    width: "100%",
    alignItems: "center",
  },
  closeLbl: {
    fontSize: 17,
    color: Neo.neonYellow,
    letterSpacing: 0.35,
  },
});
