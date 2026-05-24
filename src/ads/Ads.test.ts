import { describe, expect, it } from "vitest";
import { Ads } from "./Ads";
import type { AdsProvider } from "./types";

const instantMock: AdsProvider = {
  initialize: async () => {},
  showBanner: () => {},
  hideBanner: () => {},
  showInterstitial: async () => true,
  showRewarded: async () => true,
  isRewardedReady: () => true,
  isInterstitialReady: () => true,
};

describe("Ads", () => {
  it("showRewarded resolves true with mock provider", async () => {
    Ads.setProvider(instantMock);
    const earned = await Ads.showRewarded();
    expect(earned).toBe(true);
  });
});
