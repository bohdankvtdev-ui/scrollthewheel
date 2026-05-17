import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CARD_CATALOG } from "../../data/cards";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { IconFamily } from "../../schemas";

type ChipDetailSheetProps = {
  chipId: string | null;
  visible: boolean;
  onClose: () => void;
};

function chipEffectHint(chipId: string): string {
  const card = CARD_CATALOG[chipId];
  if (card == null) return "";
  return card.effects
    .map((e) => {
      if (e.type === "flat_money") return `+$${e.amount} at run start`;
      if (e.type === "slice_weight_mult") return `+${Math.round((e.mult - 1) * 100)}% good spin odds`;
      if (e.type === "money_shield") return `+${e.amount} shield at run start`;
      if (e.type === "expand_slices") return `Wheel expands to ${e.toCount} slices`;
      return "";
    })
    .filter(Boolean)
    .join(" · ");
}

function Glyph({ family, name }: { family: IconFamily; name: string }) {
  if (family === "MaterialCommunityIcons") {
    return (
      <MaterialCommunityIcons
        name={name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={36}
        color={Neo.ink}
      />
    );
  }
  return <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={36} color={Neo.ink} />;
}

export function ChipDetailSheet({ chipId, visible, onClose }: ChipDetailSheetProps) {
  const chip = chipId != null ? CARD_CATALOG[chipId] : null;
  if (chip == null) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconBox}>
            <Glyph family={chip.iconFamily} name={chip.icon} />
          </View>
          <Text style={[styles.name, { fontFamily: FONT_BEBAS_NEUE }]}>{chip.name}</Text>
          <Text style={styles.rarity}>{chip.rarity} loadout modifier</Text>
          <Text style={styles.desc}>{chipEffectHint(chip.id)}</Text>
          <Text style={styles.note}>
            Passive modifier row — not shop chips (currency) or a spell card.
          </Text>
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
    backgroundColor: "#BAE6FD",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: Neo.radiusCard,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 22, color: Neo.ink },
  rarity: { fontSize: 12, color: Neo.ink, opacity: 0.65, textTransform: "uppercase" },
  desc: { fontSize: 15, color: Neo.ink, textAlign: "center", marginTop: 4 },
  note: { fontSize: 11, color: Neo.ink, opacity: 0.55, fontStyle: "italic" },
  closeBtn: {
    marginTop: 8,
    backgroundColor: Neo.ink,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  closeLbl: { fontSize: 16, color: "#BAE6FD" },
});
