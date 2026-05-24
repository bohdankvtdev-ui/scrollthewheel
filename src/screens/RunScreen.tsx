import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RUN_PAGE_BACKGROUND } from "../game/runVisual";
import { isBossCycleOverlay } from "../game/cycle/bossCycleFlow";
import { RunCasinoBar } from "../components/run/RunCasinoBar";
import { RunWheelActionBar } from "../components/run/RunWheelActionBar";
import { BossCycleStage } from "../components/run/BossCycleStage";
import { RunEndModal } from "../components/run/RunEndModal";
import { RunLoadoutDock } from "../components/run/RunLoadoutDock";
import { RunLoadingShell } from "../components/run/RunLoadingShell";
import { RunStageRail } from "../components/run/RunStageRail";
import { RunNoticeHost } from "../components/run/RunNoticeHost";
import { RunDesperationOverlay } from "../components/run/RunDesperationOverlay";
import { shouldShowRunEndModal } from "../game/runState/runLossFlow";
import { RunPrizeFlash } from "../components/run/RunPrizeFlash";
import { useTacticHud } from "../hooks/useTacticHud";
import { ShopModal } from "../components/run/ShopModal";
import { YourWheelSheet } from "../components/run/YourWheelSheet";
import { useRunLifecycle } from "../hooks/useRunLifecycle";
import { ADVANCEMENT_CATALOG } from "../game/advancements";
import { PERK_CATALOG } from "../data/perks";
import { shopRerollCost } from "../game/shop/offers";
import { ShopSystem } from "../systems/ShopSystem";
import { useRunStore } from "../stores/runStore";
import { runReelUiKey } from "../game/runState/runReelFeedKey";
import { showRunInfoNotice, showRunNotice } from "../game/notices/runNotices";
import { Ads } from "../ads";
import { LAST_WHEEL_INDEX } from "../game/cycle/cycleTransition";
import { useRunChromeMetrics } from "../../lib/layout/runChrome";
import { estimateRunWheelFeedHeight } from "../../lib/layout/runStageLayout";

const SPIN_HUB_ASSET = require("../../assets/images/middle.png");

export function RunScreen() {
  const chrome = useRunChromeMetrics();
  const estimatedFeedHeight = useMemo(
    () => estimateRunWheelFeedHeight(chrome),
    [chrome]
  );
  const [pageHeight, setPageHeight] = useState(estimatedFeedHeight);
  const [shopOpen, setShopOpen] = useState(false);
  const [yourWheelOpen, setYourWheelOpen] = useState(false);
  const [shopRerolls, setShopRerolls] = useState(0);
  const feedHeightRef = useRef(estimatedFeedHeight);

  const { ready, run } = useRunLifecycle(true);
  const awaitingClaim = useRunStore((s) => s.ui.awaitingClaim);
  const shopPending = useRunStore((s) => s.ui.shopPending);
  const clearShopPending = useRunStore((s) => s.clearShopPending);
  const isSpinning = useRunStore((s) => s.ui.isSpinning);
  const lastEffect = useRunStore((s) => s.ui.lastEffect);
  const spinFeedbackTier = useRunStore((s) => s.ui.spinFeedbackTier);
  const washFlashTier = useRunStore((s) => s.ui.washFlashTier);
  const lastWonPerkId = useRunStore((s) => s.ui.lastWonPerkId);
  const lastWonDebuffId = useRunStore((s) => s.ui.lastWonDebuffId);
  const lastRewardKind = useRunStore((s) => s.ui.lastRewardKind);
  const startRun = useRunStore((s) => s.startRun);
  const bossCyclePhase = useRunStore((s) => s.ui.bossCyclePhase);
  const bossSliceEffect = useRunStore((s) => s.ui.bossSliceEffect);
  const lastResultLabel = useRunStore((s) => s.ui.lastResultLabel);
  const continueAfterCycleReward = useRunStore((s) => s.continueAfterCycleReward);
  const continueInfiniteAfterAlpha = useRunStore((s) => s.continueInfiniteAfterAlpha);
  const endRunAfterAlpha = useRunStore((s) => s.endRunAfterAlpha);
  const moneyReveal = useRunStore((s) => s.ui.moneyReveal);
  const chipReveal = useRunStore((s) => s.ui.chipReveal);
  const commitMoneyReveal = useRunStore((s) => s.commitMoneyReveal);
  const commitChipReveal = useRunStore((s) => s.commitChipReveal);
  const preSpinSnapshot = useRunStore((s) => s.preSpinSnapshot);
  const lastSliceId = useRunStore((s) => s.ui.lastSliceId);
  const gambleFlipActive = useRunStore((s) => s.ui.gambleFlipActive);
  const dismissTacticOffers = useRunStore((s) => s.dismissTacticOffers);
  const showDesperationPick = useRunStore((s) => s.ui.showDesperationPick);
  const desperationOffers = useRunStore((s) => s.ui.desperationOffers);
  const runEndFinalized = useRunStore((s) => s.ui.runEndFinalized);
  const dismissDesperationPick = useRunStore((s) => s.dismissDesperationPick);
  const reviveFromRewardedAd = useRunStore((s) => s.reviveFromRewardedAd);

  const handleWatchAdContinue = useCallback(async () => {
    const earned = await Ads.showRewarded();
    if (!earned) {
      showRunInfoNotice("Ad not available — try again in a moment");
      return;
    }
    const result = reviveFromRewardedAd();
    if (result.ok) {
      showRunNotice({
        type: "success",
        title: "Bailout",
        body: "Reward claimed — you're back in the run.",
        icon: "lifebuoy",
      });
    } else {
      showRunInfoNotice(result.reason);
    }
  }, [reviveFromRewardedAd]);
  const tacticHud = useTacticHud({
    run,
    awaitingClaim,
    isSpinning,
    lastSliceId,
    gambleFlipActive,
    hasPreSpinSnapshot: preSpinSnapshot != null,
  });

  const pageBg = RUN_PAGE_BACKGROUND;

  useLayoutEffect(() => {
    feedHeightRef.current = estimatedFeedHeight;
    setPageHeight(estimatedFeedHeight);
  }, [estimatedFeedHeight]);

  const onWheelStageLayout = useCallback(
    (h: number) => {
      const rounded = Math.floor(h);
      if (rounded < 200) return;
      const useLargeWheel = chrome.largeUi;
      const minHeight = useLargeWheel
        ? estimatedFeedHeight
        : Math.round(estimatedFeedHeight * 0.92);
      const blended = Math.max(rounded, minHeight);
      if (Math.abs(feedHeightRef.current - blended) < 6) return;
      feedHeightRef.current = blended;
      setPageHeight(blended);
    },
    [estimatedFeedHeight, chrome.largeUi]
  );

  const bossOverlay = isBossCycleOverlay(bossCyclePhase);

  const showRunEnd = useMemo(() => {
    if (run == null) return false;
    return shouldShowRunEndModal({
      phase: run.phase,
      bossCyclePhase,
      showDesperationPick,
      runEndFinalized,
      moneyReveal,
    });
  }, [bossCyclePhase, moneyReveal, run, runEndFinalized, showDesperationPick]);

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
        showRunInfoNotice(result.reason);
        return;
      }
      useRunStore.setState({ run: result.run });
      const perk = PERK_CATALOG[perkId];
      showRunNotice({
        type: "success",
        title: perk != null ? perk.name : "Upgrade bought",
        body: "Added to your loadout",
        icon: perk?.icon ?? "stars",
      });
    },
    []
  );

  const handleBuyForge = useCallback(
    (forgeId: string) => {
      const current = useRunStore.getState().run;
      if (current == null) return;
      const result = ShopSystem.buyForge(current, forgeId);
      if (!result.ok) {
        showRunInfoNotice(result.reason);
        return;
      }
      useRunStore.setState({ run: result.run });
      showRunNotice({ type: "success", title: "Forge upgraded", icon: "build" });
    },
    []
  );

  const handleBuyAdvancement = useCallback(
    (advancementId: string) => {
      const current = useRunStore.getState().run;
      if (current == null) return;
      const result = ShopSystem.buyAdvancement(current, advancementId);
      if (!result.ok) {
        showRunInfoNotice(result.reason);
        return;
      }
      useRunStore.setState({ run: result.run });
      const def = ADVANCEMENT_CATALOG[advancementId];
      showRunNotice({
        type: "success",
        title: def != null ? def.name : "Upgrade installed",
        body: "Installed for this run",
        icon: def?.icon ?? "upgrade",
      });
    },
    []
  );

  const handleSell = useCallback(
    (perkId: string) => {
      const current = useRunStore.getState().run;
      if (current == null) return;
      const result = ShopSystem.sell(current, perkId);
      if (!result.ok) {
        showRunInfoNotice(result.reason);
        return;
      }
      useRunStore.setState({ run: result.run });
      showRunNotice({ type: "success", title: "Perk sold", icon: "sell" });
    },
    []
  );

  const handleReroll = useCallback(() => {
    const current = useRunStore.getState().run;
    if (current == null) return;
    const cost = shopRerollCost(current, shopRerolls);
    const result = ShopSystem.reroll(current, shopRerolls);
    if (!result.ok) {
      showRunInfoNotice(result.reason);
      return;
    }
    useRunStore.setState({ run: result.run });
    setShopRerolls((r) => r + 1);
    showRunNotice({
      type: "info",
      title: "Shop rerolled",
      body: `−${cost} chips`,
      icon: "refresh",
    });
  }, [shopRerolls]);

  const handleBuyConsumable = useCallback(
    (consumableId: "wedge_eraser") => {
      const current = useRunStore.getState().run;
      if (current == null) return;
      const result = ShopSystem.buyConsumable(current, consumableId);
      if (!result.ok) {
        showRunInfoNotice(result.reason);
        return;
      }
      useRunStore.setState({ run: result.run });
      showRunNotice({
        type: "success",
        title: "Wedge Laser",
        body: "Tap the square under the map",
        icon: "ray-start",
      });
    },
    []
  );

  if (!ready || run == null) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
        <RunLoadingShell />
      </SafeAreaView>
    );
  }

  const hidePrizeBar = bossOverlay || run.phase === "won" || run.phase === "alpha_won";
  const isBossAwaitingClaim =
    awaitingClaim && run.wheelIndex === LAST_WHEEL_INDEX && bossCyclePhase === "none";
  const reelUiKey = runReelUiKey({
    awaitingClaim,
    gambleFlipActive,
    lastResultLabel,
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: pageBg }]} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="light" />
      <View style={styles.screenStack} pointerEvents="box-none">
      <RunCasinoBar
        run={run}
        moneyReveal={moneyReveal}
        onMoneyRevealDone={commitMoneyReveal}
        shopHighlighted={shopPending && awaitingClaim}
        onShop={handleShopOpen}
        onReset={handleReset}
      />
      <RunStageRail run={run} />
      <View style={styles.loadoutStack}>
        <RunLoadoutDock
          run={run}
          highlightPerkId={lastWonPerkId}
          highlightDebuffId={lastWonDebuffId}
        />
        <RunNoticeHost />
      </View>
      <BossCycleStage
        run={run}
        pageHeight={pageHeight}
        reelUiKey={reelUiKey}
        bossCyclePhase={bossCyclePhase}
        bossSliceEffect={bossSliceEffect}
        onContinue={continueAfterCycleReward}
        onContinueInfinite={continueInfiniteAfterAlpha}
        onEndCampaign={endRunAfterAlpha}
        onLayout={onWheelStageLayout}
      />
      {!hidePrizeBar ? (
        <RunWheelActionBar
          run={run}
          chipReveal={chipReveal}
          onChipRevealDone={commitChipReveal}
          onYourWheel={() => setYourWheelOpen(true)}
        />
      ) : null}
      {!hidePrizeBar ? (
        <RunPrizeFlash
          effect={lastEffect}
          awaitingClaim={awaitingClaim}
          isSpinning={isSpinning}
          lastRewardKind={lastRewardKind}
          tacticPick={tacticHud.phase === "pick"}
          run={run}
          onDismissTactic={dismissTacticOffers}
          bossEndCycleHint={isBossAwaitingClaim}
          spinFeedbackTier={washFlashTier ?? spinFeedbackTier}
        />
      ) : null}
      {showDesperationPick ? (
        <RunDesperationOverlay
          run={run}
          offers={desperationOffers}
          onGiveUp={dismissDesperationPick}
          onWatchAd={handleWatchAdContinue}
        />
      ) : null}
      <ShopModal
        visible={shopOpen}
        run={run}
        onClose={handleShopClose}
        onBuy={handleBuy}
        onBuyAdvancement={handleBuyAdvancement}
        onBuyForge={handleBuyForge}
        onBuyConsumable={handleBuyConsumable}
        onSell={handleSell}
        onReroll={handleReroll}
      />
      <YourWheelSheet visible={yourWheelOpen} run={run} onClose={() => setYourWheelOpen(false)} />
      {showRunEnd ? (
        <RunEndModal
          phase={run.phase}
          floor={run.floor}
          money={run.money}
          peakMoney={run.peakMoney}
          onRestart={handleReset}
          onWatchAd={handleWatchAdContinue}
        />
      ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenStack: {
    flex: 1,
  },
  loadoutStack: {
    position: "relative",
    zIndex: 40,
    overflow: "visible",
  },
});
