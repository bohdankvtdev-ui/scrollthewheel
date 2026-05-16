import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Asset } from "expo-asset";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { PRIZE_SLICES } from "../../constants/prizes";
import {
  computeSpinWheelTextSize,
  computeWheelInnerSize,
} from "../../lib/layout/wheelFrame";
import { CASH_SPIN_WHEEL_PROFILE } from "../../lib/wheel";
import { mapPrizesToItems } from "../../lib/spin/mapPrizesToItems";
import { formatUsdTotal, sumClaimedPrizeDollars } from "../../lib/spin/sumPrizes";
import { Neo } from "../../theme/neoBrutal";
import { CashSpinAppHeader } from "./components/CashSpinAppHeader";
import { CashSpinScrollFeed } from "./components/CashSpinScrollFeed";
import { useScrollTheWheelRounds } from "./hooks/useScrollTheWheelRounds";
import { CASH_SPIN_PAGE_THEMES, type CashSpinPageTheme } from "./pageThemes";

const SPIN_HUB_ASSET = require("../../assets/images/middle.png");

const INITIAL_ROUNDS = 6;

export function CashSpinScreen() {
  const { width, height } = useWindowDimensions();
  const [latestLabel, setLatestLabel] = useState<string | null>(null);
  const [viewportH, setViewportH] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [reelCtx, setReelCtx] = useState({ activeReelIndex: 0, roundCount: INITIAL_ROUNDS });

  const [shellTheme, setShellTheme] = useState<CashSpinPageTheme>(() => CASH_SPIN_PAGE_THEMES[0]);
  const onPageThemeChange = useCallback((t: CashSpinPageTheme) => {
    setShellTheme(t);
  }, []);

  useEffect(() => {
    void Asset.fromModule(SPIN_HUB_ASSET as number)
      .downloadAsync()
      .catch(() => {
        /* native image modules are not URLs — avoid expo-image prefetch on require() */
      });
  }, []);

  const { rounds, markSpinWon, markClaimed, growToMinLength } = useScrollTheWheelRounds(INITIAL_ROUNDS);

  const wheelData = useMemo(() => mapPrizesToItems(PRIZE_SLICES), []);

  const wheelInnerSize = useMemo(
    () => computeWheelInnerSize(Math.min(width, height)),
    [width, height]
  );

  const textSize = useMemo(
    () => computeSpinWheelTextSize(wheelInnerSize),
    [wheelInnerSize]
  );

  const itemHeight = useMemo(() => {
    if (viewportH > 0) return viewportH;
    return Math.max(360, height - headerH - 24);
  }, [headerH, height, viewportH]);

  const totalLine = useMemo(() => {
    const sum = sumClaimedPrizeDollars(rounds);
    return formatUsdTotal(sum);
  }, [rounds]);

  const reelProgressLine = useMemo(
    () => `REEL ${reelCtx.activeReelIndex + 1} · ${reelCtx.roundCount}`,
    [reelCtx.activeReelIndex, reelCtx.roundCount]
  );

  const onLatestPrize = useCallback((label: string) => {
    setLatestLabel(label);
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: shellTheme.pageBg }}
      edges={["top", "bottom", "left", "right"]}
    >
      <StatusBar style="light" />
      <CashSpinAppHeader
        totalLine={totalLine}
        latestLine={latestLabel}
        reelProgressLine={reelProgressLine}
        headerStripeColor={shellTheme.headerStripe}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      />
      <View
        style={{ flex: 1, backgroundColor: shellTheme.pageBg }}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
      >
        {viewportH > 0 ? (
          <CashSpinScrollFeed
            itemHeight={itemHeight}
            wheelData={wheelData}
            wheelInnerSize={wheelInnerSize}
            textSize={textSize}
            wheelPhysics={CASH_SPIN_WHEEL_PROFILE.physics}
            segmentColors={Neo.segmentColors}
            textColor={Neo.wheelSliceLabel}
            rounds={rounds}
            onSpinWon={markSpinWon}
            onClaimed={markClaimed}
            onLatestPrize={onLatestPrize}
            growToMinLength={growToMinLength}
            onPageThemeChange={onPageThemeChange}
            onReelContext={setReelCtx}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
