import type { AdsProvider } from "../types";

const REWARDED_SIM_MS = 900;

/**
 * Expo Go / dev fallback — no native AdMob module required.
 * Replace with `admobAdsProvider` in production dev builds.
 */
export function createMockAdsProvider(): AdsProvider {
  let rewardedReady = true;
  let interstitialReady = true;
  let bannerVisible = false;

  return {
    async initialize() {
      rewardedReady = true;
      interstitialReady = true;
    },

    showBanner() {
      bannerVisible = true;
    },

    hideBanner() {
      bannerVisible = false;
    },

    async showInterstitial() {
      if (!interstitialReady) return false;
      interstitialReady = false;
      await delay(400);
      interstitialReady = true;
      return true;
    },

    async showRewarded() {
      if (!rewardedReady) return false;
      rewardedReady = false;
      await delay(REWARDED_SIM_MS);
      rewardedReady = true;
      return true;
    },

    isRewardedReady() {
      return rewardedReady;
    },

    isInterstitialReady() {
      return interstitialReady;
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
