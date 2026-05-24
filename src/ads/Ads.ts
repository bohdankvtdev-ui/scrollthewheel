import { createMockAdsProvider } from "./providers/mockAdsProvider";
import type { AdsProvider } from "./types";

let provider: AdsProvider = createMockAdsProvider();
let initPromise: Promise<void> | null = null;

function getProvider(): AdsProvider {
  return provider;
}

/**
 * AdMob facade — swap `setAdsProvider` when `react-native-google-mobile-ads` is linked.
 */
export const Ads = {
  async initialize(): Promise<void> {
    if (initPromise != null) return initPromise;
    initPromise = getProvider()
      .initialize()
      .catch(() => {
        initPromise = null;
      });
    return initPromise;
  },

  /** Test / production builds — inject a native AdMob provider. */
  setProvider(next: AdsProvider): void {
    provider = next;
    initPromise = null;
  },

  showBanner(): void {
    getProvider().showBanner();
  },

  hideBanner(): void {
    getProvider().hideBanner();
  },

  async showInterstitial(): Promise<boolean> {
    await Ads.initialize();
    if (!getProvider().isInterstitialReady()) return false;
    return getProvider().showInterstitial();
  },

  /** Resolves `true` when the user earned the reward. */
  async showRewarded(): Promise<boolean> {
    await Ads.initialize();
    if (!getProvider().isRewardedReady()) return false;
    return getProvider().showRewarded();
  },

  isRewardedReady(): boolean {
    return getProvider().isRewardedReady();
  },

  isInterstitialReady(): boolean {
    return getProvider().isInterstitialReady();
  },
};
