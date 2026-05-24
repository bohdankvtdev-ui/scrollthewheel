import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GuideScreenHeader } from "../components/guide/GuideScreenHeader";
import { RankStatCell, RankStatRow } from "../components/ranks/RankStatRow";
import { refreshRanksScreen, saveDisplayName, setLeaderboardOptIn } from "../ranks";
import { defaultDisplayName } from "../ranks/rankPrefs";
import { getRankUserId } from "../ranks/RankService";
import { useRankStore } from "../stores/rankStore";
import { formatMoney } from "../utils/formatMoney";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoSubtitleOnDark } from "../../theme/neoBrutal";

export function LeaderboardScreen() {
  const router = useRouter();
  const configured = useRankStore((s) => s.configured);
  const loading = useRankStore((s) => s.loading);
  const syncing = useRankStore((s) => s.syncing);
  const prefs = useRankStore((s) => s.prefs);
  const entries = useRankStore((s) => s.entries);
  const myRank = useRankStore((s) => s.myRank);
  const totalPlayers = useRankStore((s) => s.totalPlayers);
  const banner = useRankStore((s) => s.banner);
  const setBanner = useRankStore((s) => s.setBanner);
  const clearBanner = useRankStore((s) => s.clearBanner);

  const userId = getRankUserId();
  const fallbackName = userId != null ? defaultDisplayName(userId) : "Player";

  const [nameDraft, setNameDraft] = useState(prefs.displayName || fallbackName);
  const [savingName, setSavingName] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setNameDraft(prefs.displayName.trim().length > 0 ? prefs.displayName.trim() : fallbackName);
  }, [prefs.displayName, fallbackName]);

  useFocusEffect(
    useCallback(() => {
      void refreshRanksScreen();
    }, [])
  );

  const optedIn = prefs.leaderboardOptIn;
  const peakDisplay = Math.max(prefs.localBestPeakMoney, myRank?.peakMoney ?? 0);
  const rankDisplay = useMemo(() => {
    if (!optedIn) return "—";
    if (!myRank?.registered) return "New";
    if (myRank.rank != null) return `#${myRank.rank}`;
    return "50+";
  }, [myRank, optedIn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearBanner();
    await refreshRanksScreen();
    setRefreshing(false);
  }, [clearBanner]);

  const onJoinBoard = useCallback(async () => {
    void Haptics.selectionAsync();
    clearBanner();
    const next = !optedIn;
    await setLeaderboardOptIn(next);
    if (next) {
      setBanner({ type: "success", text: "You're in! Scores upload after each run." });
      await refreshRanksScreen();
    }
  }, [clearBanner, optedIn, setBanner]);

  const onSaveName = useCallback(async () => {
    if (savingName) return;
    Keyboard.dismiss();
    setSavingName(true);
    clearBanner();
    try {
      const result = await saveDisplayName(nameDraft);
      if (result.message.length > 0) {
        setBanner({ type: result.ok ? "success" : "error", text: result.message });
      }
      if (result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNameDraft(useRankStore.getState().prefs.displayName.trim() || fallbackName);
      }
    } finally {
      setSavingName(false);
    }
  }, [clearBanner, fallbackName, nameDraft, savingName, setBanner]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <GuideScreenHeader title="Hall of fame" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={Neo.neonCyan}
          />
        }
      >
        {banner != null ? (
          <View
            style={[
              styles.toast,
              banner.type === "success" && styles.toastOk,
              banner.type === "error" && styles.toastErr,
            ]}
          >
            <Text style={styles.toastText}>{banner.text}</Text>
            <Pressable onPress={clearBanner} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={16} color="#FAFAFA" />
            </Pressable>
          </View>
        ) : null}

        <RankStatRow>
          <RankStatCell label="Peak bank" value={peakDisplay > 0 ? formatMoney(peakDisplay) : "—"} accent={Neo.neonYellow} />
          <RankStatCell label="Rank" value={rankDisplay} accent={Neo.neonCyan} />
          <RankStatCell
            label="Rivals"
            value={optedIn && totalPlayers > 0 ? totalPlayers.toLocaleString() : "—"}
            last
          />
        </RankStatRow>

        <Pressable
          style={({ pressed }) => [styles.joinCard, pressed && styles.joinPressed, optedIn && styles.joinActive]}
          onPress={() => void onJoinBoard()}
          disabled={!configured}
        >
          <MaterialCommunityIcons
            name={optedIn ? "trophy" : "trophy-outline"}
            size={28}
            color={optedIn ? Neo.neonYellow : "rgba(250,250,250,0.5)"}
          />
          <View style={styles.joinText}>
            <Text style={[styles.joinTitle, { fontFamily: FONT_BEBAS_NEUE }]}>
              {optedIn ? "Competing globally" : "Join the chase"}
            </Text>
            <Text style={neoSubtitleOnDark(12)}>
              {configured
                ? "Peak bank only · tap to toggle"
                : "Leaderboard URL missing in .env"}
            </Text>
          </View>
          <View style={[styles.joinPill, optedIn && styles.joinPillOn]}>
            <Text style={[styles.joinPillText, { fontFamily: FONT_BEBAS_NEUE }]}>{optedIn ? "ON" : "OFF"}</Text>
          </View>
        </Pressable>

        {optedIn && configured ? (
          <View style={styles.nameCard}>
            <Text style={[styles.nameLabel, { fontFamily: FONT_BEBAS_NEUE }]}>Your tag</Text>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={fallbackName}
              placeholderTextColor="rgba(250,250,250,0.35)"
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => void onSaveName()}
              editable={!savingName}
            />
            <Pressable
              style={({ pressed }) => [styles.nameBtn, pressed && !savingName && styles.nameBtnPressed]}
              onPress={() => void onSaveName()}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color={Neo.ink} size="small" />
              ) : (
                <Text style={[styles.nameBtnText, { fontFamily: FONT_BEBAS_NEUE }]}>Lock in name</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.boardTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Top spinners</Text>
        {(loading || syncing) && entries.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Neo.neonCyan} />
          </View>
        ) : entries.length === 0 ? (
          <Text style={[neoSubtitleOnDark(14), styles.empty]}>
            {optedIn ? "Beat a run — your score lands here." : "Join the chase to see rivals."}
          </Text>
        ) : (
          entries.map((item) => (
            <View
              key={`${item.rank}-${item.userId}`}
              style={[styles.boardRow, item.isSelf && styles.boardRowSelf]}
            >
              <Text style={[styles.boardRank, { fontFamily: FONT_BEBAS_NEUE }]}>#{item.rank}</Text>
              <View style={styles.boardMid}>
                <Text style={[styles.boardName, { fontFamily: FONT_BEBAS_NEUE }]} numberOfLines={1}>
                  {item.displayName}
                  {item.isSelf ? " · you" : ""}
                </Text>
              </View>
              <Text style={[styles.boardScore, { fontFamily: FONT_BEBAS_NEUE }]}>
                {formatMoney(item.peakMoney)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1a1428" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toastOk: {
    borderColor: "rgba(74,222,128,0.4)",
    backgroundColor: "rgba(74,222,128,0.12)",
  },
  toastErr: {
    borderColor: "rgba(248,113,113,0.4)",
    backgroundColor: "rgba(248,113,113,0.12)",
  },
  toastText: { flex: 1, fontSize: 13, color: "#FAFAFA" },
  joinCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Neo.radiusCard,
    borderWidth: Neo.borderWidth,
    borderColor: "rgba(250,250,250,0.15)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  joinActive: {
    borderColor: Neo.neonYellow,
    backgroundColor: "rgba(252,211,77,0.08)",
  },
  joinPressed: { opacity: 0.92 },
  joinText: { flex: 1, gap: 2 },
  joinTitle: { fontSize: 20, color: "#FAFAFA", letterSpacing: 0.4 },
  joinPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(250,250,250,0.25)",
  },
  joinPillOn: {
    borderColor: Neo.neonCyan,
    backgroundColor: "rgba(34,211,238,0.15)",
  },
  joinPillText: { fontSize: 14, color: "#FAFAFA", letterSpacing: 0.5 },
  nameCard: {
    gap: 8,
    padding: 14,
    borderRadius: Neo.radiusCard,
    borderWidth: 1,
    borderColor: "rgba(250,250,250,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  nameLabel: {
    fontSize: 14,
    color: Neo.neonCyan,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  nameInput: {
    borderWidth: 2,
    borderColor: "rgba(250,250,250,0.2)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FAFAFA",
    fontSize: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  nameBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neo.neonYellow,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    minHeight: 44,
  },
  nameBtnPressed: { opacity: 0.9 },
  nameBtnText: { fontSize: 16, color: Neo.ink, letterSpacing: 0.5, textTransform: "uppercase" },
  boardTitle: {
    fontSize: 15,
    color: "rgba(250,250,250,0.6)",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  loadingBox: { paddingVertical: 28, alignItems: "center" },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  boardRowSelf: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.5)",
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  boardRank: { width: 44, fontSize: 20, color: Neo.neonYellow },
  boardMid: { flex: 1, minWidth: 0 },
  boardName: { fontSize: 17, color: "#FAFAFA" },
  boardScore: { fontSize: 16, color: "#4ADE80" },
  empty: { textAlign: "center", paddingVertical: 16 },
});
