import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { DEBUFF_CATALOG } from "../../data/debuffs";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import type { IconFamily } from "../../schemas";

type DebuffDetailSheetProps = {
  debuffId: string | null;
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
    <MaterialIcons name={name as keyof typeof MaterialIcons.glyphMap} size={40} color={color} />
  );
}

export function DebuffDetailSheet({ debuffId, visible, onClose }: DebuffDetailSheetProps) {
  const debuff = debuffId != null ? DEBUFF_CATALOG[debuffId] : null;
  if (debuff == null) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Glyph family={debuff.iconFamily} name={debuff.icon} color="#991B1B" />
          </View>
          <Text style={[styles.badge, { fontFamily: FONT_BEBAS_NEUE }]}>Curse</Text>
          <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>{debuff.name}</Text>
          <Text style={styles.body}>{debuff.description}</Text>
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={[styles.btnText, { fontFamily: FONT_BEBAS_NEUE }]}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#1A1228",
    borderRadius: 16,
    borderWidth: Neo.borderBold,
    borderColor: "#F87171",
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  badge: {
    fontSize: 13,
    color: "#FCA5A5",
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    color: Neo.textOnDark,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: "rgba(250,250,250,0.75)",
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F87171",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
  },
  btnText: {
    fontSize: 18,
    color: Neo.ink,
  },
});
