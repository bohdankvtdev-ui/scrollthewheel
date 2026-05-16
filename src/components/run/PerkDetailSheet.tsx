import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PERK_CATALOG } from "../../data/perks";
import { PERK_TIER_LABELS } from "../../game/gdd";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { IconFamily } from "../../schemas";

type PerkDetailSheetProps = {
  perkId: string | null;
  visible: boolean;
  onClose: () => void;
};

function Glyph({ family, name }: { family: IconFamily; name: string }) {
  if (family === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={40}
        color={Neo.ink}
      />
    );
  }
  return <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={40} color={Neo.ink} />;
}

export function PerkDetailSheet({ perkId, visible, onClose }: PerkDetailSheetProps) {
  const perk = perkId != null ? PERK_CATALOG[perkId] : null;
  if (perk == null) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconBox}>
            <Glyph family={perk.iconFamily} name={perk.icon} />
          </View>
          <Text style={[styles.name, { fontFamily: FONT_BEBAS_NEUE }]}>{perk.name}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.tier, { fontFamily: FONT_BEBAS_NEUE }]}>
              {PERK_TIER_LABELS[perk.tier]}
            </Text>
            <Text style={styles.category}>{perk.category}</Text>
          </View>
          <Text style={styles.desc}>{perk.description}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeLbl, { fontFamily: FONT_BEBAS_NEUE }]}>Close</Text>
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
    maxWidth: 320,
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: Neo.radiusCard,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    color: Neo.ink,
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  tier: {
    fontSize: 14,
    color: Neo.ink,
    backgroundColor: Neo.neonCyan,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  category: {
    fontSize: 12,
    color: Neo.ink,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 15,
    color: Neo.ink,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 8,
    backgroundColor: Neo.ink,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  closeLbl: {
    fontSize: 16,
    color: Neo.neonYellow,
    letterSpacing: 0.35,
  },
});
