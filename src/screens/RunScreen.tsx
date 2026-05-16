import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WHEEL_STAGES } from "../game/loop";
import { RunCasinoBar } from "../components/run/RunCasinoBar";
import { RunEndModal } from "../components/run/RunEndModal";
import { RunLoadoutDock } from "../components/run/RunLoadoutDock";
import { RunLoadingShell } from "../components/run/RunLoadingShell";
import { RunStageRail } from "../components/run/RunStageRail";
import { RunToastHost } from "../components/run/RunToastHost";
import { RunPrizeFlash } from "../components/run/RunPrizeFlash";
import { ShopModal } from "../components/run/ShopModal";
import { RunWheelFeed } from "../components/wheel/RunWheelFeed";
import { useRunLifecycle } from "../hooks/useRunLifecycle";
import { PERK_CATALOG } from "../data/perks";
import { RunManager } from "../systems/RunManager";
import { shopRerollCost } from "../game/shop/offers";
import { ShopSystem } from "../systems/ShopSystem";
import { useRunStore } from "../stores/runStore";
import { useRunToastStore } from "../stores/runToastStore";

const SPIN_HUB_ASSET = require("../../assets/images/middle.png");

export function RunScreen() {
  const [pageHeight, setPageHeight] = useState(320);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopRerolls, setShopRerolls] = useState(0);
  const feedHeightRef = useRef(320);

  const { ready, run } = useRunLifecycle(true);
  const awaitingClaim = useRunStore((s) => s.ui.awaitingClaim);
  const shopPending = useRunStore((s) => s.ui.shopPending);
  const clearShopPending = useRunStore((s) => s.clearShopPending);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const lastEffect = useRunStore((s) => s.ui.lastEffect);
  const lastWonPerkId = useRunStore((s) => s.ui.lastWonPerkId);
  const lastRewardKind = useRunStore((s) => s.ui.lastRewardKind);
  const startRun = useRunStore((s) => s.startRun);
  const showToast = useRunToastStore((s) => s.show);

  const role = run?.wheels[run.wheelIndex]?.definition.role ?? "base";
  const pageBg = WHEEL_STAGES[role]?.pageTint ?? "#141018";

  const onFeedLayout = useCallback((h: number) => {
    const rounded = Math.floor(h);
    if (rounded < 200 || Math.abs(feedHeightRef.current - rounded) < 2) return;
    feedHeightRef.current = rounded;
    setPageHeight(rounded);
  }, []);

  useEffect(() => {
    void Asset.fromModule(SPIN_HUB_ASSET as number)
      .downloadAsync()
      .catch(() => {});
  }, []);

  const handleShopOpen = useCallback(() => {
    setShopOpen(true);
    setShopRerolls(0);
    clearShopPending();
  }, [clearShopPending]);

  const handleReset = useCallback(() => {
    startRun(1);
    setShopOpen(false);
    setShopRerolls(0);
    clearShopPending();
  }, [startRun, clearShopPending]);

  const handleShopClose = useCallback(() => {
    setShopOpen(false);
    setShopRerolls(0);
    clearShopPending();
  }, [clearShopPending]);

  const handleBuy = useCallback(
    (perkId: string) => {
      const current = useRunStore.getState().run;
      if (current == null) return;
      const result = ShopSystem.buy(current, perkId);
      if (!result.ok) {
        showToast({ type: "info", title: result.reason, icon: "info" });
        return;
      }
      useRunStore.setState({ run: result.run });
      const perk = PERK_CATALOG[perkId];
      showToast({
        type: "success",
        title: perk != null ? `Bought: ${perk.name}` : "Upgrade bought!",
        icon: perk?.icon ?? "stars",
      });
    },
    [showToast]
  );

  const handleSell = useCallback(
    (perkId: string) => {
      const current = useRunStore.getState().run;
      if (current == null) return;
      const result = ShopSystem.sell(current, perkId);
      if (!result.ok) {
        showToast({ type: "info", title: result.reason, icon: "info" });
        return;
      }
      useRunStore.setState({ run: result.run });
      showToast({ type: "success", title: "Joker sold", icon: "sell" });
    },
    [showToast]
  );

  const handleReroll = useCallback(() => {
    const current = useRunStore.getState().run;
    if (current == null) return;
    const cost = shopRerollCost(current, shopRerolls);
    const result = ShopSystem.reroll(current, shopRerolls);
    if (!result.ok) {
      showToast({ type: "info", title: result.reason, icon: "info" });
      return;
    }
    useRunStore.setState({ run: result.run });
    setShopRerolls((r) => r + 1);
    showToast({ type: "info", title: `Rerolled (−$${cost})`, icon: "refresh" });
  }, [shopRerolls, showToast]);

  const handleContinueInfinite = useCallback(() => {
    const current = useRunStore.getState().run;
    if (current == null) return;
    const next = RunManager.onBossClearedContinue(current);
    useRunStore.setState({
      run: next,
      ui: {
        ...useRunStore.getState().ui,
        activeWheelIndex: 0,
        awaitingClaim: false,
        lastResultLabel: null,
        lastSliceId: null,
        lastEffect: null,
        lastWonPerkId: null,
        lastRewardKind: null,
      },
    });
  }, []);

  if (!ready || run == null) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <RunLoadingShell />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pageBg }]} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="light" />
      <RunToastHost />
      <RunCasinoBar
        run={run}
        shopHighlighted={shopPending && awaitingClaim}
        onShop={handleShopOpen}
        onReset={handleReset}
      />
      <RunStageRail run={run} />
      <RunLoadoutDock run={run} highlightPerkId={lastWonPerkId} />
      <View style={styles.feed} onLayout={(e) => onFeedLayout(e.nativeEvent.layout.height)}>
        <RunWheelFeed run={run} pageHeight={pageHeight} />
      </View>
      <RunPrizeFlash
        effect={lastEffect}
        awaitingClaim={awaitingClaim}
        isSpinning={isSpinning}
        lastRewardKind={lastRewardKind}
      />
      <ShopModal
        visible={shopOpen}
        run={run}
        onClose={handleShopClose}
        onBuy={handleBuy}
        onSell={handleSell}
        onReroll={handleReroll}
      />
      <RunEndModal
        phase={run.phase}
        floor={run.floor}
        onRestart={handleReset}
        onContinueInfinite={run.phase === "won" ? handleContinueInfinite : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  feed: { flex: 1, minHeight: 280, overflow: "hidden" },
});
