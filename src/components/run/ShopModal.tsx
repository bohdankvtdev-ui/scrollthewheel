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
import { homeBrutalButton, homeKickerStyle, HomePalette, HomeScreenTheme as T } from "../../../theme/homeScreen";
import { BALATRO_ECONOMY } from "../../game/balatroEconomy";
import { PERK_TIER_LABELS } from "../../game/gdd";
import { PERK_CATALOG } from "../../data/perks";
import { getPerkFamily, PERK_FAMILY_COLORS, PERK_FAMILY_LABELS } from "../../game/perks/perkFamilies";
import { shortenPerkLockReason } from "../../game/shop/perkCatalog";
import { getSpendableChips } from "../../game/shop/chipEconomy";
import { shopRerollCost } from "../../game/shop/offers";
import { countJokers, ShopSystem } from "../../systems/ShopSystem";
import type { RunState } from "../../schemas";

const SHOP = {
  bg: T.background,
  panel: T.panelDark,
  card: "#2E2444",
  border: T.ink,
  text: T.textOnDark,
  muted: T.textMutedOnDark,
  chip: HomePalette.cyan,
  money: HomePalette.green,
  perk: HomePalette.yellow,
  upgrade: HomePalette.purpleBright,
  danger: HomePalette.magenta,
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

type OfferNode = ReturnType<typeof ShopSystem.listOfferNodes>[number];
type AdvNode = ReturnType<typeof ShopSystem.listAdvancementNodes>[number];

function perkShopStyle(perkId: string) {
  const catalog = PERK_CATALOG[perkId];
  if (catalog == null) {
    return {
      bg: SHOP.perk,
      accent: Neo.ink,
      cardTint: "rgba(255, 235, 59, 0.12)",
      border: SHOP.perk,
      label: "PERK",
    };
  }
  const family = getPerkFamily(perkId, catalog.category);
  const colors = PERK_FAMILY_COLORS[family];
  return { ...colors, label: PERK_FAMILY_LABELS[family].toUpperCase() };
}

function ChipCost({
  cost,
  large,
  muted,
  showLabel,
}: {
  cost: number;
  large?: boolean;
  muted?: boolean;
  showLabel?: boolean;
}) {
  const color = muted ? SHOP.muted : SHOP.chip;
  return (
    <View style={styles.chipCostRow}>
      <MaterialCommunityIcons name="poker-chip" size={large ? 20 : 16} color={color} />
      <Text
        style={[
          styles.chipCostText,
          large && styles.chipCostTextLg,
          muted && styles.chipCostTextMuted,
          { fontFamily: FONT_BEBAS_NEUE, color },
        ]}
      >
        {cost}
        {showLabel ? " chips" : ""}
      </Text>
    </View>
  );
}

function CardPriceFooter({
  cost,
  playerChips,
  canAfford,
  owned,
  locked,
  lockReason,
}: {
  cost: number;
  playerChips: number;
  canAfford: boolean;
  owned: boolean;
  locked: boolean;
  lockReason?: string | null;
}) {
  const lockLabel = shortenPerkLockReason(lockReason ?? null);
  const shortfall = Math.max(0, cost - playerChips);

  if (owned) {
    return (
      <Text style={[styles.statusText, styles.statusTextOwned, { fontFamily: FONT_BEBAS_NEUE }]}>
        Owned
      </Text>
    );
  }

  return (
    <View style={styles.priceFooterCol}>
      <View style={[styles.pricePill, !canAfford && styles.pricePillShort]}>
        <ChipCost cost={cost} large muted={!canAfford} />
      </View>
      {!canAfford && shortfall > 0 ? (
        <Text style={[styles.shortfallText, { fontFamily: FONT_BEBAS_NEUE }]}>
          Short {shortfall}
        </Text>
      ) : null}
      {locked && lockLabel != null ? (
        <Text style={[styles.lockHintText, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={2}>
          {lockLabel}
        </Text>
      ) : null}
    </View>
  );
}

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
  playerChips,
  cardTint,
  familyBorder,
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
  playerChips: number;
  cardTint?: string;
  familyBorder?: string;
}) {
  const disabled = owned || locked || !canAfford;
  const lockLabel = shortenPerkLockReason(lockReason ?? null);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.card,
        fullWidth && styles.cardFull,
        featured
          ? {
              backgroundColor: cardTint ?? "rgba(255, 235, 59, 0.1)",
              borderWidth: T.borderBold,
              borderColor: familyBorder ?? SHOP.perk,
              borderLeftWidth: 6,
              borderLeftColor: familyBorder ?? SHOP.perk,
            }
          : { borderColor: accent },
        owned && styles.cardOwned,
        disabled && !owned && styles.cardDisabled,
        !disabled && pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${title}. ${description}. ${owned ? "Owned" : `${cost} chips${!canAfford ? `, short ${Math.max(0, cost - playerChips)}` : ""}`}${lockLabel ? `. ${lockLabel}` : ""}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent }]}>
        <VectorIcon name={icon} family={iconFamily} size={34} color={iconTint ?? Neo.ink} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.badgeRow}>
            {tier != null ? (
              <View style={styles.tierPill}>
                <Text style={[styles.tierBadge, { fontFamily: FONT_BEBAS_NEUE }]}>
                  {PERK_TIER_LABELS[tier as 0 | 1 | 2 | 3] ?? `T${tier}`}
                </Text>
              </View>
            ) : null}
            <View style={[styles.familyPill, { backgroundColor: accent }]}>
              <Text style={[styles.badge, { color: iconTint ?? Neo.ink, fontFamily: FONT_BEBAS_NEUE }]}>
                {badge}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.cardSubtitle, { color: iconTint ?? accent }]} numberOfLines={1}>
          {subtitle}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <CardPriceFooter
          cost={cost}
          playerChips={playerChips}
          canAfford={canAfford}
          owned={owned}
          locked={locked}
          lockReason={lockReason}
        />
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

  const perkOffers = ShopSystem.listOfferNodes(run, offerIds);
  const advNodes = ShopSystem.listAdvancementNodes(run, advancementIds);
  const owned = ShopSystem.listOwnedJokers(run);
  const ownedAdv = ShopSystem.listOwnedAdvancements(run);
  const forgeNodes = ShopSystem.listForgeNodes(run);
  const eraserNode = ShopSystem.consumableNode(run, "wedge_eraser");
  const jokers = countJokers(run);
  const advCount = (run.advancements ?? []).length;
  const chips = getSpendableChips(run);
  const rerollChipCost = shopRerollCost(run, rerolls);
  const canReroll = chips >= rerollChipCost;
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
            <View style={styles.headerText}>
              <Text style={[styles.kicker, homeKickerStyle(), { fontFamily: FONT_BEBAS_NEUE }]}>
                Between wheels
              </Text>
              <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>
                Perk <Text style={styles.titleAccent}>shop</Text>
              </Text>
              <Text style={styles.subtitle}>Pick one perk · reroll for new options</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={16} style={styles.closeBtn} accessibilityLabel="Close shop">
              <MaterialIcons name="close" size={26} color={SHOP.text} />
            </Pressable>
          </View>

          <View style={styles.chipHero}>
            <MaterialCommunityIcons name="poker-chip" size={28} color={SHOP.chip} />
            <Text style={[styles.chipHeroValue, { fontFamily: FONT_BEBAS_NEUE }]}>{chips}</Text>
            <Text style={styles.chipHeroLabel}>shop chips</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statPill, styles.statPillMoney]}>
              <MaterialIcons name="attach-money" size={18} color={SHOP.money} />
              <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>${run.money}</Text>
              <Text style={styles.statLabel}>bank</Text>
            </View>
            <View style={[styles.statPill, styles.statPillPerk]}>
              <MaterialIcons name="auto-awesome" size={18} color={SHOP.perk} />
              <Text style={[styles.statValue, { fontFamily: FONT_BEBAS_NEUE }]}>
                {jokers}/{BALATRO_ECONOMY.maxJokerSlots}
              </Text>
              <Text style={styles.statLabel}>perks</Text>
            </View>
            <View style={[styles.statPill, styles.statPillUpgrade]}>
              <MaterialIcons name="upgrade" size={18} color={HomePalette.purple} />
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
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionDot} />
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Perk picks</Text>
              </View>
              <Text style={styles.sectionHint}>
                Price in chips on every card — tap to buy
              </Text>
              {perkOffers.length === 0 ? (
                <Text style={styles.emptyHint}>No perks available — try rerolling</Text>
              ) : (
                perkOffers.map((node: OfferNode) => {
                  const family = perkShopStyle(node.perkId);
                  return (
                    <ShopCard
                      key={node.perkId}
                      title={node.name}
                      subtitle={node.tagline || family.label}
                      description={node.description}
                      icon={node.icon}
                      iconFamily={
                        node.iconFamily === "MaterialCommunityIcons"
                          ? "MaterialCommunityIcons"
                          : "MaterialIcons"
                      }
                      accent={family.bg}
                      iconTint={family.accent}
                      badge={family.label}
                      cardTint={family.cardTint}
                      familyBorder={family.border}
                      tier={node.tier}
                      cost={node.cost}
                      owned={node.owned}
                      locked={node.locked}
                      lockReason={node.lockReason}
                      canAfford={node.canAfford}
                      playerChips={chips}
                      featured
                      onPress={() => onBuy(node.perkId)}
                      fullWidth={cardFull}
                    />
                  );
                })
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.rerollBtn,
                  !canReroll && styles.rerollBtnDisabled,
                  pressed && canReroll && styles.cardPressed,
                ]}
                onPress={canReroll ? handleReroll : undefined}
                disabled={!canReroll}
                accessibilityRole="button"
                accessibilityLabel={`Reroll perk picks for ${rerollChipCost} chips`}
              >
                <MaterialIcons name="refresh" size={22} color={canReroll ? SHOP.chip : SHOP.muted} />
                <View style={styles.rerollCopy}>
                  <Text style={[styles.rerollTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Reroll picks</Text>
                  <Text style={styles.rerollHint}>
                    {canReroll
                      ? "New random perks · costs chips each time"
                      : `Need ${Math.max(0, rerollChipCost - chips)} more chips · you have ${chips}`}
                  </Text>
                </View>
                <ChipCost cost={rerollChipCost} large muted={!canReroll} />
              </Pressable>
            </View>

            <View style={styles.divider}>
              <Text style={[styles.dividerText, { fontFamily: FONT_BEBAS_NEUE }]}>Also in shop</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Tools</Text>
              <ShopCard
                title={eraserNode.name}
                subtitle={`Owned ${eraserNode.owned}/${eraserNode.maxStack}`}
                description={eraserNode.description}
                icon={eraserNode.icon}
                iconFamily="MaterialCommunityIcons"
                accent={HomePalette.cyan}
                iconTint={Neo.ink}
                badge="TOOL"
                cost={eraserNode.cost}
                owned={eraserNode.owned >= eraserNode.maxStack}
                locked={eraserNode.owned >= eraserNode.maxStack}
                canAfford={eraserNode.canAfford}
                playerChips={chips}
                onPress={() => onBuyConsumable("wedge_eraser")}
                fullWidth={cardFull}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Chip forge</Text>
              <Text style={styles.sectionHint}>Permanent run boosts — level up with chips</Text>
              {forgeNodes.map((node) => (
                <ShopCard
                  key={node.forgeId}
                  title={`${node.name} · Lv ${node.level}`}
                  subtitle={node.maxed ? "Max level" : `Next · Lv ${node.level + 1}`}
                  description={node.description}
                  icon={node.icon}
                  iconFamily={node.iconFamily}
                  accent={HomePalette.cyan}
                  iconTint={Neo.ink}
                  badge="FORGE"
                  cost={node.cost}
                  owned={node.maxed}
                  locked={node.maxed}
                  canAfford={node.canAfford}
                  playerChips={chips}
                  onPress={() => onBuyForge(node.forgeId)}
                  fullWidth={cardFull}
                />
              ))}
            </View>

            {advNodes.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Run upgrades</Text>
                <Text style={styles.sectionHint}>Extra wedges & passive power for this run</Text>
                {advNodes.map((node: AdvNode) => (
                  <ShopCard
                    key={node.advancementId}
                    title={node.name}
                    subtitle={node.tagline}
                    description={node.description}
                    icon={node.icon}
                    iconFamily="MaterialIcons"
                    accent={SHOP.upgrade}
                    iconTint={HomePalette.purple}
                    badge="UPGRADE"
                    cost={node.cost}
                    owned={node.owned}
                    locked={node.locked}
                    canAfford={node.canAfford}
                    playerChips={chips}
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
                    <View key={a.advancementId} style={styles.ownedChip}>
                      <Text style={[styles.ownedName, { fontFamily: FONT_BEBAS_NEUE }]}>{a.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {owned.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Sell perks</Text>
                <Text style={styles.sectionHint}>Refund half the chip price</Text>
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
            <Pressable
              style={({ pressed }) => [
                styles.continueBtn,
                homeBrutalButton(HomePalette.yellow),
                pressed && styles.cardPressed,
              ]}
              onPress={onClose}
            >
              <Text style={[styles.continueText, { fontFamily: FONT_BEBAS_NEUE }]}>Back to wheel</Text>
              <MaterialIcons name="arrow-forward" size={22} color={Neo.ink} />
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
    backgroundColor: "rgba(10, 8, 16, 0.78)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHOP.bg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: T.borderBold,
    borderLeftWidth: T.borderBold,
    borderRightWidth: T.borderBold,
    borderColor: SHOP.border,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  kicker: {
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    color: SHOP.text,
    letterSpacing: 0.4,
  },
  titleAccent: {
    color: SHOP.perk,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
    color: SHOP.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: T.borderThin,
    borderColor: SHOP.border,
    backgroundColor: SHOP.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  chipHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: SHOP.panel,
    borderWidth: T.borderThin,
    borderColor: SHOP.border,
    borderLeftWidth: 5,
    borderLeftColor: SHOP.perk,
    borderRadius: T.radius,
  },
  chipHeroValue: {
    fontSize: 32,
    color: SHOP.chip,
    letterSpacing: 0.5,
  },
  chipHeroLabel: {
    fontSize: 14,
    color: SHOP.muted,
    marginTop: 4,
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
    gap: 5,
    backgroundColor: SHOP.card,
    borderWidth: T.borderThin,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statPillMoney: {
    borderColor: "rgba(74, 222, 128, 0.45)",
    backgroundColor: "rgba(74, 222, 128, 0.08)",
  },
  statPillPerk: {
    borderColor: "rgba(255, 235, 59, 0.45)",
    backgroundColor: "rgba(255, 235, 59, 0.08)",
  },
  statPillUpgrade: {
    borderColor: "rgba(196, 181, 253, 0.45)",
    backgroundColor: "rgba(196, 181, 253, 0.08)",
  },
  statValue: {
    fontSize: 16,
    color: SHOP.text,
  },
  statLabel: {
    fontSize: 11,
    color: SHOP.muted,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    color: SHOP.text,
    letterSpacing: 0.35,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SHOP.perk,
    borderWidth: 1.5,
    borderColor: SHOP.border,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: SHOP.muted,
    marginBottom: 2,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(250,250,250,0.1)",
    paddingTop: 4,
  },
  dividerText: {
    fontSize: 12,
    color: SHOP.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: SHOP.card,
    borderWidth: T.borderThin,
    borderRadius: 14,
    padding: 12,
    minHeight: 96,
  },
  cardFull: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  cardOwned: {
    opacity: 0.5,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  familyPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Neo.ink,
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(250,250,250,0.12)",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierBadge: {
    fontSize: 10,
    color: SHOP.muted,
    letterSpacing: 0.3,
  },
  emptyHint: {
    fontSize: 14,
    color: SHOP.muted,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    borderWidth: T.borderThin,
    borderColor: Neo.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    color: SHOP.text,
    flex: 1,
  },
  badge: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: SHOP.chip,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 17,
    color: SHOP.muted,
  },
  cardFooter: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 76,
  },
  priceFooterCol: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 96,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(34, 211, 238, 0.45)",
  },
  pricePillShort: {
    backgroundColor: "rgba(251, 113, 133, 0.1)",
    borderColor: "rgba(251, 113, 133, 0.35)",
  },
  shortfallText: {
    fontSize: 11,
    color: SHOP.danger,
    letterSpacing: 0.25,
    textAlign: "right",
  },
  lockHintText: {
    fontSize: 10,
    lineHeight: 13,
    color: SHOP.muted,
    textAlign: "right",
  },
  statusText: {
    fontSize: 13,
    color: SHOP.money,
    letterSpacing: 0.2,
    textAlign: "right",
  },
  statusTextOwned: {
    color: SHOP.money,
  },
  chipCostTextMuted: {
    opacity: 0.85,
  },
  chipCostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipCostText: {
    fontSize: 16,
    color: SHOP.chip,
  },
  chipCostTextLg: {
    fontSize: 20,
  },
  rerollBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: T.borderThin,
    borderColor: SHOP.chip,
    backgroundColor: "rgba(34, 211, 238, 0.08)",
  },
  rerollBtnDisabled: {
    borderColor: "rgba(250,250,250,0.12)",
    backgroundColor: SHOP.card,
    opacity: 0.75,
  },
  rerollCopy: {
    flex: 1,
    gap: 2,
  },
  rerollTitle: {
    fontSize: 17,
    color: SHOP.text,
    letterSpacing: 0.3,
  },
  rerollHint: {
    fontSize: 12,
    color: SHOP.muted,
  },
  ownedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ownedChip: {
    borderWidth: T.borderThin,
    borderColor: HomePalette.purple,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(196, 181, 253, 0.12)",
  },
  sellChip: {
    borderWidth: T.borderThin,
    borderColor: "rgba(250,250,250,0.14)",
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
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(250,250,250,0.1)",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  continueText: {
    fontSize: 18,
    color: Neo.ink,
    letterSpacing: 0.35,
  },
});
