export type AdPlacement = "banner" | "interstitial" | "rewarded";

export type AdsProvider = {
  initialize(): Promise<void>;
  showBanner(): void;
  hideBanner(): void;
  showInterstitial(): Promise<boolean>;
  showRewarded(): Promise<boolean>;
  isRewardedReady(): boolean;
  isInterstitialReady(): boolean;
};
