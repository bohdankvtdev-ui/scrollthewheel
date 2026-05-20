import { useCallback, useEffect, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { VectorIcon } from "../../../lib/ui/VectorIcon";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FONT_BEBAS_NEUE } from "../../../theme/fonts";
import { Neo } from "../../../theme/neoBrutal";
import { BALATRO_ECONOMY } from "../../game/balatroEconomy";
import { PERK_TIER_LABELS } from "../../game/gdd";
import { getSpendableChips } from "../../game/shop/chipEconomy";
import { shopRerollCost } from "../../game/shop/offers";
import { countJokers, ShopSystem, type ShopPerkCatalogEntry } from "../../systems/ShopSystem";
import type { RunState } from "../../schemas";

const SHOP = {
  bg: "#0F0A18",
  card: "#1A1228",
  cardBorder: "#2D2440",
  jokerAccent: "#FFE94D",
  advAccent: "#A78BFA",
  text: "#FAFAFA",
  muted: "rgba(250,250,250,0.62)",
  chip: "#22D3EE",
  money: "#4ADE80",
  danger: "#FB7185",
} as const;

type ShopModalProps = {
  visible: boolean;
  run: RunState;
  onClose: () => void;
  onBuy: (perkId: string) => void;
  onBuyAdvancement: (advancementId: string) => void;
  onBuyForge: (forgeId: string) => void;
  onBuyConsumable: (id: "wedge_eraser") => void;
  onSell: (perkId: string) => void;
  onReroll: () => void;
};

function ChipCost({ cost, large }: { cost: number; large?: boolean }) {
  return (
    <View style={styles.chipCostRow}>
      <MaterialCommunityIcons name="poker-chip" size={large ? 22 : 18} color={SHOP.chip} />
      <Text style={[styles.chipCostText, large && styles.chipCostTextLg, { fontFamily: FONT_BEBAS_NEUE }]}>
        {cost}
      </Text>
    </View>
  );
}

type AdvNode = ReturnType<typeof ShopSystem.listAdvancementNodes>[number];

function ShopCard({
  title,
  subtitle,
  description,
  icon,
  iconFamily,
  accent,
  iconTint,
  badge,
  cost,
  owned,
  locked,
  lockReason,
  canAfford,
  onPress,
  fullWidth,
  featured,
  tier,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconFamily: "MaterialIcons" | "MaterialCommunityIcons";
  accent: string;
  iconTint?: string;
  badge: string;
  cost: number;
  owned: boolean;
  locked: boolean;
  lockReason?: string | null;
  canAfford: boolean;
  onPress: () => void;
  fullWidth?: boolean;
  featured?: boolean;
  tier?: number;
}) {
  const disabled = owned || locked || !canAfford;
  const statusLabel =
    owned ? "OWNED" : locked && lockReason != null ? lockReason.toUpperCase() : locked ? "LOCKED" : null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.card,
        fullWidth && styles.cardFull,
        { borderColor: featured ? SHOP.jokerAccent : accent },
        featured && styles.cardFeatured,
        owned && styles.cardOwned,
        disabled && !owned && styles.cardDisabled,
        !disabled && pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent }]}>
        <VectorIcon name={icon} family={iconFamily} size={36} color={iconTint ?? Neo.ink} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.badgeRow}>
            {tier != null ? (
              <Text style={[styles.tierBadge, { fontFamily: FONT_BEBAS_NEUE }]}>
                {PERK_TIER_LABELS[tier as 0 | 1 | 2 | 3] ?? `T${tier}`}
              </Text>
            ) : null}
            <Text style={[styles.badge, { color: accent, fontFamily: FONT_BEBAS_NEUE }]}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {featured ? `★ Pick · ${subtitle}` : subtitle}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        {statusLabel != null ? (
          <Text
            style={[
              styles.statusText,
              lockReason != null && styles.statusTextSmall,
              { fontFamily: FONT_BEBAS_NEUE },
            ]}
            numberOfLines={2}
          >
            {statusLabel}
          </Text>
        ) : !canAfford ? (
          <Text style={[styles.statusText, { color: SHOP.danger, fontFamily: FONT_BEBAS_NEUE }]}>
            NEED CHIPS
          </Text>
        ) : (
          <ChipCost cost={cost} large />
        )}
      </View>
    </Pressable>
  );
}

function PerkCatalogTile({
  entry,
  onPress,
}: {
  entry: ShopPerkCatalogEntry;
  onPress: () => void;
}) {
  const disabled = !entry.purchasable || !entry.canAfford;
  const status =
    entry.owned
      ? "✓"
      : entry.lockReason != null
        ? "!"
        : entry.canAfford
          ? entry.cost
          : "·";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.catalogTile,
        { borderColor: entry.inOffers ? SHOP.jokerAccent : entry.familyBg },
        entry.inOffers && styles.catalogTileFeatured,
        entry.owned && styles.catalogTileOwned,
        !disabled && pressed && styles.cardPressed,
      ]}
      accessibilityLabel={`${entry.name} — ${entry.description}`}
    >
      <View style={[styles.catalogIcon, { backgroundColor: entry.familyBg }]}>
        <VectorIcon name={entry.icon} family={entry.iconFamily} size={22} color={entry.familyAccent} />
      </View>
      <Text style={[styles.catalogName, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={styles.catalogDesc} numberOfLines={2}>
        {entry.description}
      </Text>
      <View style={styles.catalogFooter}>
        {typeof status === "number" ? (
          <ChipCost cost={status} />
        ) : (
          <Text style={[styles.catalogStatus, { fontFamily: FONT_BEBAS_NEUE }]}>{status}</Text>
        )}
      </View>
    </Pressable>
  );
}

export function ShopModal({
  visible,
  run,
  onClose,
  onBuy,
  onBuyAdvancement,
  onBuyForge,
  onBuyConsumable,
  onSell,
  onReroll,
}: ShopModalProps) {
  const { width } = useWindowDimensions();
  const [offerIds, setOfferIds] = useState<string[]>([]);
  const [advancementIds, setAdvancementIds] = useState<string[]>([]);
  const [rerolls, setRerolls] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setOfferIds(ShopSystem.pickOffers(run, rerolls));
    setAdvancementIds(ShopSystem.pickAdvancementOffers(run, rerolls));
  }, [
    visible,
    run.runId,
    run.history.length,
    run.perks.length,
    (run.advancements ?? []).join(","),
    run.chipsEarnedThisRun,
    rerolls,
  ]);

  useEffect(() => {
    if (!visible) setRerolls(0);
  }, [visible]);

  const perkCatalog = ShopSystem.listPerkCatalog(run, offerIds);
  const dealPerks = perkCatalog.filter((e) => e.inOffers && !e.owned);
  const catalogPerks = perkCatalog.filter((e) => !e.owned);
  const advNodes = ShopSystem.listAdvancementNodes(run, advancementIds);
  const owned = ShopSystem.listOwnedJokers(run);
  const ownedAdv = ShopSystem.listOwnedAdvancements(run);
  const forgeNodes = ShopSystem.listForgeNodes(run);
  const eraserNode = ShopSystem.consumableNode(run, "wedge_eraser");
  const jokers = countJokers(run);
  const advCount = (run.advancements ?? []).length;
  const chips = getSpendableChips(run);
  const rerollChipCost = shopRerollCost(run, rerolls);
  const cardFull = width < 400;

  const handleReroll = useCallback(() => {
    onReroll();
    setRerolls((r) => r + 1);
  }, [onReroll]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>Shop</Text>
              <Text style={styles.subtitle}>Buy any unlocked perk · reroll picks</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={16} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={SHOP.text} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <MaterialCommunityIcons name="poker-chip" size={22} color={SHOP.chip} />
              <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>{chips}</Text>
              <Text style={styles.statLabel}>chips</Text>
            </View>
            <View style={styles.statPill}>
              <MaterialIcons name="attach-money" size={22} color={SHOP.money} />
              <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>${run.money}</Text>
              <Text style={styles.statLabel}>bank</Text>
            </View>
            <View style={styles.statPill}>
              <MaterialIcons name="auto-awesome" size={20} color={SHOP.jokerAccent} />
              <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>
                {jokers}/{BALATRO_ECONOMY.maxJokerSlots}
              </Text>
              <Text style={styles.statLabel}>perks</Text>
            </View>
            <View style={styles.statPill}>
              <MaterialIcons name="upgrade" size={20} color={SHOP.advAccent} />
              <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>
                {advCount}/{BALATRO_ECONOMY.maxAdvancements}
              </Text>
              <Text style={styles.statLabel}>upgrades</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Perk picks</Text>
              <Text style={styles.sectionHint}>Reroll refreshes highlighted deals · buy any unlocked perk below</Text>
              {dealPerks.length === 0 ? (
                <Text style={styles.emptyHint}>No deals — check the catalog or reroll</Text>
              ) : (
                dealPerks.map((entry) => (
                  <ShopCard
                    key={`deal-${entry.perkId}`}
                    title={entry.name}
                    subtitle={entry.tagline || entry.familyLabel}
                    description={entry.description}
                    icon={entry.icon}
                    iconFamily={
                      entry.iconFamily === "MaterialCommunityIcons"
                        ? "MaterialCommunityIcons"
                        : "MaterialIcons"
                    }
                    accent={entry.familyBg}
                    iconTint={entry.familyAccent}
                    badge={entry.familyLabel.toUpperCase()}
                    tier={entry.tier}
                    cost={entry.cost}
                    owned={entry.owned}
                    locked={!entry.purchasable}
                    lockReason={entry.lockReason}
                    canAfford={entry.canAfford}
                    featured
                    onPress={() => onBuy(entry.perkId)}
                    fullWidth={cardFull}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>All perks</Text>
              <Text style={styles.sectionHint}>
                {catalogPerks.length} available · tap to buy when unlocked
              </Text>
              <View style={styles.catalogGrid}>
                {perkCatalog.map((entry) => (
                  <View key={`cat-${entry.perkId}`} style={styles.catalogCell}>
                    <PerkCatalogTile
                      entry={entry}
                      onPress={() => onBuy(entry.perkId)}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
                Consumables
              </Text>
              <Text style={styles.sectionHint}>
                Wedge Laser — tap the square button under the wheel map, then tap a wedge
              </Text>
              <ShopCard
                title={eraserNode.name}
                subtitle={`Owned · ${eraserNode.owned}/${eraserNode.maxStack}`}
                description={eraserNode.description}
                icon={eraserNode.icon}
                iconFamily="MaterialCommunityIcons"
                accent={SHOP.chip}
                badge="TOOL"
                cost={eraserNode.cost}
                owned={eraserNode.owned >= eraserNode.maxStack}
                locked={eraserNode.owned >= eraserNode.maxStack}
                canAfford={eraserNode.canAfford}
                onPress={() => onBuyConsumable("wedge_eraser")}
                fullWidth={cardFull}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
                Chip forge
              </Text>
              <Text style={styles.sectionHint}>
                Infinite upgrades — cash, %, guards, shields
              </Text>
              {forgeNodes.map((node) => (
                <ShopCard
                  key={node.forgeId}
                  title={`${node.name} · Lv ${node.level}`}
                  subtitle={node.maxed ? "MAX" : `Next · Lv ${node.level + 1}`}
                  description={node.description}
                  icon={node.icon}
                  iconFamily={node.iconFamily}
                  accent={SHOP.chip}
                  badge="FORGE"
                  cost={node.cost}
                  owned={node.maxed}
                  locked={node.maxed}
                  canAfford={node.canAfford}
                  onPress={() => onBuyForge(node.forgeId)}
                  fullWidth={cardFull}
                />
              ))}
            </View>

            {advNodes.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
                  Run upgrades
                </Text>
                <Text style={styles.sectionHint}>Add wedges & passive power — permanent this run</Text>
                {advNodes.map((node: AdvNode) => (
                  <ShopCard
                    key={node.advancementId}
                    title={node.name}
                    subtitle={node.tagline}
                    description={node.description}
                    icon={node.icon}
                    iconFamily="MaterialIcons"
                    accent={SHOP.advAccent}
                    badge="UPGRADE"
                    cost={node.cost}
                    owned={node.owned}
                    locked={node.locked}
                    canAfford={node.canAfford}
                    onPress={() => onBuyAdvancement(node.advancementId)}
                    fullWidth={cardFull}
                  />
                ))}
              </View>
            ) : null}

            {ownedAdv.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Your upgrades</Text>
                <View style={styles.ownedRow}>
                  {ownedAdv.map((a) => (
                    <View key={a.advancementId} style={[styles.ownedChip, { borderColor: SHOP.advAccent }]}>
                      <Text style={[styles.ownedName, { fontFamily: FONT_BEBAS_NEUE }]}>{a.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {owned.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Sell perks</Text>
                <View style={styles.ownedRow}>
                  {owned.map((j) => (
                    <Pressable key={j.perkId} style={styles.sellChip} onPress={() => onSell(j.perkId)}>
                      <Text style={[styles.ownedName, { fontFamily: FONT_BEBAS_NEUE }]}>{j.name}</Text>
                      <ChipCost cost={j.sellValue} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.rerollBtn} onPress={handleReroll}>
              <MaterialIcons name="refresh" size={20} color={SHOP.chip} />
              <Text style={[styles.rerollText, { fontFamily: FONT_BEBAS_NEUE }]}>
                Reroll offers · {rerollChipCost} chips
              </Text>
            </Pressable>
            <Pressable style={styles.continueBtn} onPress={onClose}>
              <Text style={[styles.continueText, { fontFamily: FONT_BEBAS_NEUE }]}>Continue spinning</Text>
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
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHOP.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 3,
    borderColor: Neo.ink,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    color: SHOP.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: SHOP.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SHOP.card,
    borderWidth: 2,
    borderColor: SHOP.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 18,
    color: SHOP.text,
  },
  statLabel: {
    fontSize: 12,
    color: SHOP.muted,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: SHOP.text,
    letterSpacing: 0.4,
  },
  sectionHint: {
    fontSize: 13,
    color: SHOP.muted,
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: SHOP.card,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
  },
  cardFull: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  cardOwned: {
    opacity: 0.55,
  },
  cardDisabled: {
    opacity: 0.72,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardFeatured: {
    borderWidth: 3,
    backgroundColor: "rgba(255,233,77,0.06)",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierBadge: {
    fontSize: 10,
    color: SHOP.muted,
    letterSpacing: 0.4,
  },
  statusTextSmall: {
    fontSize: 11,
    textAlign: "right",
    maxWidth: 88,
  },
  emptyHint: {
    fontSize: 14,
    color: SHOP.muted,
    fontStyle: "italic",
  },
  catalogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  catalogCell: {
    width: "48%",
    flexGrow: 1,
    minWidth: 150,
    maxWidth: "48%",
  },
  catalogTile: {
    backgroundColor: SHOP.card,
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    gap: 6,
    minHeight: 128,
  },
  catalogTileFeatured: {
    borderWidth: 2,
  },
  catalogTileOwned: {
    opacity: 0.45,
  },
  catalogIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  catalogName: {
    fontSize: 16,
    color: SHOP.text,
    letterSpacing: 0.3,
  },
  catalogDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: SHOP.muted,
    flex: 1,
  },
  catalogFooter: {
    alignItems: "flex-start",
  },
  catalogStatus: {
    fontSize: 14,
    color: SHOP.muted,
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    color: SHOP.text,
    flex: 1,
  },
  badge: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: SHOP.chip,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 19,
    color: SHOP.muted,
  },
  cardFooter: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 72,
  },
  statusText: {
    fontSize: 14,
    color: SHOP.muted,
    letterSpacing: 0.3,
  },
  chipCostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipCostText: {
    fontSize: 18,
    color: SHOP.chip,
  },
  chipCostTextLg: {
    fontSize: 22,
  },
  ownedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ownedChip: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sellChip: {
    borderWidth: 2,
    borderColor: SHOP.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: SHOP.card,
    gap: 4,
  },
  ownedName: {
    fontSize: 14,
    color: SHOP.text,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: SHOP.cardBorder,
  },
  rerollBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: SHOP.cardBorder,
    backgroundColor: SHOP.card,
  },
  rerollText: {
    fontSize: 16,
    color: SHOP.chip,
  },
  continueBtn: {
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: Neo.neonYellow,
    borderWidth: 3,
    borderColor: Neo.ink,
    borderRadius: 12,
  },
  continueText: {
    fontSize: 18,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
});
