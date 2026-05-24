import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { HomePalette } from "../../../theme/homeScreen";
import { Neo } from "../../../theme/neoBrutal";
import { isBossCycleOverlay, shouldHideWheelFeedDuringBoss } from "../../game/cycle/bossCycleFlow";
import type { RunState } from "../../schemas";
import type { RunUiEffect } from "../../stores/runStore";
import type { PitStopOptionId } from "../../game/tactics/cyclePitStop";
import { RunWheelFeed } from "../wheel/RunWheelFeed";
import { BossCycleRewardPanel } from "./BossCycleRewardPanel";

type BossCycleStageProps = {
  run: RunState;
  pageHeight: number;
  reelUiKey: string;
  bossCyclePhase: "none" | "reward";
  bossSliceEffect: RunUiEffect | null;
  onContinue: (pitId?: PitStopOptionId) => void;
  onContinueInfinite: () => void;
  onEndCampaign: () => void;
  onLayout: (height: number) => void;
};

/**
 * Wheel slot + boss cycle overlay. Feed stays mounted (preloads next wheel) but is
 * fully hidden under an opaque scrim whenever the reward card is shown.
 */
export const BossCycleStage = memo(function BossCycleStage({
  run,
  pageHeight,
  reelUiKey,
  bossCyclePhase,
  bossSliceEffect,
  onContinue,
  onContinueInfinite,
  onEndCampaign,
  onLayout,
}: BossCycleStageProps) {
  const overlay = isBossCycleOverlay(bossCyclePhase);
  const hideFeed = shouldHideWheelFeedDuringBoss(bossCyclePhase);
  return (
    <View style={styles.stage} onLayout={(e) => onLayout(e.nativeEvent.layout.height)}>
      <View
        style={[styles.feedHost, hideFeed && styles.feedHidden]}
        pointerEvents={overlay ? "none" : "auto"}
        accessibilityElementsHidden={hideFeed}
        importantForAccessibility={hideFeed ? "no-hide-descendants" : "auto"}
      >
        <RunWheelFeed run={run} pageHeight={pageHeight} reelUiKey={reelUiKey} />
      </View>
      {overlay ? (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.overlayStripeTop} pointerEvents="none" />
          <View style={styles.overlayStripeMid} pointerEvents="none" />
          <View style={styles.overlayGlow} pointerEvents="none" />
          <BossCycleRewardPanel
            run={run}
            bossSliceEffect={bossSliceEffect}
            onContinue={onContinue}
            onContinueInfinite={onContinueInfinite}
            onEndCampaign={onEndCampaign}
          />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 280,
    overflow: "hidden",
  },
  feedHost: {
    flex: 1,
  },
  feedHidden: {
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#6D28D9",
    zIndex: 12,
  },
  overlayStripeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: HomePalette.yellow,
    borderBottomWidth: Neo.borderThin,
    borderBottomColor: Neo.ink,
  },
  overlayStripeMid: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: HomePalette.cyan,
    opacity: 0.85,
  },
  overlayGlow: {
    position: "absolute",
    top: "18%",
    left: "8%",
    right: "8%",
    height: "42%",
    borderRadius: 999,
    backgroundColor: HomePalette.magenta,
    opacity: 0.14,
  },
});
