import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { RUN_PAGE_BACKGROUND } from "../../game/runVisual";
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
    backgroundColor: RUN_PAGE_BACKGROUND,
    zIndex: 12,
  },
});
