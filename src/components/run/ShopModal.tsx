import { useCallback, useEffect, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { PERK_CATALOG } from "../../data/perks";
import { BALATRO_ECONOMY } from "../../game/balatroEconomy";
import { PERK_TIER_LABELS } from "../../game/gdd";
import { countJokers, ShopSystem } from "../../systems/ShopSystem";
import type { RunState } from "../../schemas";

type ShopModalProps = {
  visible: boolean;
  run: RunState;
  onClose: () => void;
  onBuy: (perkId: string) => void;
  onSell: (perkId: string) => void;
  onReroll: () => void;
};

function ShopNode({
  node,
  onBuy,
}: {
  node: ReturnType<typeof ShopSystem.listOfferNodes>[number];
  onBuy: () => void;
}) {
  const disabled = node.owned || node.locked || !node.canAfford;
  const Icon =
    node.iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : MaterialIcons;

  return (
    <Pressable
      onPress={disabled ? undefined : onBuy}
      style={({ pressed }) => [
        styles.node,
        node.owned && styles.nodeOwned,
        node.locked && styles.nodeLocked,
        !disabled && pressed && styles.nodePressed,
      ]}
    >
      <View style={[styles.nodeIcon, { backgroundColor: node.owned ? Neo.neonCyan : Neo.neonYellow }]}>
        <Icon name={node.icon as never} size={28} color={Neo.ink} />
      </View>
      <Text style={[styles.nodeName, { fontFamily: FONT_BEBAS_NEUE }]}>{node.name}</Text>
      {PERK_CATALOG[node.perkId] != null ? (
        <Text style={[styles.tierTag, { fontFamily: FONT_BEBAS_NEUE }]}>
          {PERK_TIER_LABELS[PERK_CATALOG[node.perkId]!.tier]}
        </Text>
      ) : null}
      <Text style={styles.nodeDesc} numberOfLines={2}>
        {node.description}
      </Text>
      <Text style={[styles.nodeCost, { fontFamily: FONT_BEBAS_NEUE }]}>
        {node.owned ? "OWNED" : node.locked ? "LOCKED" : `$${node.cost}`}
      </Text>
    </Pressable>
  );
}

export function ShopModal({ visible, run, onClose, onBuy, onSell, onReroll }: ShopModalProps) {
  const [offerIds, setOfferIds] = useState<string[]>([]);
  const [rerolls, setRerolls] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setOfferIds(ShopSystem.pickOffers(run, rerolls));
  }, [visible, run.runId, run.history.length, run.perks.length, run.money, rerolls]);

  useEffect(() => {
    if (!visible) setRerolls(0);
  }, [visible]);

  const nodes = ShopSystem.listOfferNodes(run, offerIds);
  const owned = ShopSystem.listOwnedJokers(run);
  const jokers = countJokers(run);

  const handleReroll = useCallback(() => {
    onReroll();
    setRerolls((r) => r + 1);
  }, [onReroll]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>Joker shop</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={28} color={Neo.textOnDark} />
            </Pressable>
          </View>
          <Text style={styles.balance}>
            ${run.money} · Jokers {jokers}/{BALATRO_ECONOMY.maxJokerSlots}
          </Text>

          <ScrollView contentContainerStyle={styles.tree}>
            <View style={styles.offerRow}>
              {nodes.map((node) => (
                <ShopNode
                  key={`${node.perkId}-${node.tier}-${node.cost}`}
                  node={node}
                  onBuy={() => onBuy(node.perkId)}
                />
              ))}
            </View>

            {owned.length > 0 ? (
              <View style={styles.sellSection}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Sell</Text>
                <View style={styles.sellRow}>
                  {owned.map((j) => (
                    <Pressable key={j.perkId} style={styles.sellChip} onPress={() => onSell(j.perkId)}>
                      <Text style={[styles.sellName, { fontFamily: FONT_BEBAS_NEUE }]}>{j.name}</Text>
                      <Text style={styles.sellVal}>+${j.sellValue}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.rerollBtn} onPress={handleReroll}>
              <Text style={[styles.rerollText, { fontFamily: FONT_BEBAS_NEUE }]}>Reroll offers</Text>
            </Pressable>
            <Pressable style={styles.continueBtn} onPress={onClose}>
              <Text style={[styles.continueText, { fontFamily: FONT_BEBAS_NEUE }]}>Continue — next wheel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Neo.surfaceDark,
    borderTopWidth: Neo.borderBold,
    borderTopColor: Neo.ink,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "82%",
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    color: Neo.textOnDark,
    letterSpacing: 0.5,
  },
  balance: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    fontSize: 16,
    color: Neo.neonYellow,
    fontWeight: "700",
  },
  tree: {
    paddingHorizontal: 14,
    gap: 16,
    paddingBottom: 12,
  },
  offerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  node: {
    width: 148,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  nodeOwned: { opacity: 0.55, borderColor: Neo.neonCyan },
  nodeLocked: { opacity: 0.4 },
  nodePressed: { transform: [{ translateY: 2 }] },
  nodeIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeName: {
    fontSize: 16,
    color: Neo.textOnDark,
    textAlign: "center",
  },
  tierTag: {
    fontSize: 10,
    color: Neo.neonCyan,
    letterSpacing: 0.3,
  },
  nodeDesc: {
    fontSize: 11,
    color: "rgba(250,250,250,0.65)",
    textAlign: "center",
    minHeight: 28,
  },
  nodeCost: {
    fontSize: 15,
    color: Neo.neonYellow,
    letterSpacing: 0.3,
  },
  sellSection: { gap: 8 },
  sectionTitle: {
    fontSize: 16,
    color: Neo.neonCyan,
    letterSpacing: 0.3,
  },
  sellRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sellChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sellName: { fontSize: 13, color: Neo.textOnDark },
  sellVal: { fontSize: 12, color: Neo.neonYellow },
  footer: {
    paddingHorizontal: 18,
    gap: 10,
    borderTopWidth: Neo.borderThin,
    borderTopColor: "rgba(250,250,250,0.12)",
    paddingTop: 12,
  },
  rerollBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: Neo.borderThin,
    borderColor: Neo.ink,
    borderRadius: 10,
  },
  rerollText: { fontSize: 15, color: Neo.neonCyan },
  continueBtn: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Neo.neonYellow,
    borderWidth: Neo.borderBold,
    borderColor: Neo.ink,
    borderRadius: 10,
  },
  continueText: { fontSize: 16, color: Neo.ink },
});
