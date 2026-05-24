import type { ConfigContext, ExpoConfig } from "expo/config";

import storeListing from "./store/metadata/en-US.json";

/**
 * Dynamic Expo config — keeps secrets out of git and syncs store listing copy to `extra.aso`.
 * Static fields remain in app.json; this file overrides env-sensitive and version fields.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;

  const leaderboardApiUrl =
    process.env.EXPO_PUBLIC_LEADERBOARD_API_URL ??
    (base.extra?.leaderboardApiUrl as string | undefined);

  const leaderboardSubmitKey =
    process.env.EXPO_PUBLIC_LEADERBOARD_SUBMIT_KEY ?? process.env.LEADERBOARD_SUBMIT_KEY;

  const iosBuildNumber = process.env.IOS_BUILD_NUMBER ?? "1";
  const androidVersionCode = Number(process.env.ANDROID_VERSION_CODE ?? "1");

  return {
    ...base,
    name: storeListing.appName,
    slug: base.slug ?? "scroll-the-wheel",
    ios: {
      ...base.ios,
      buildNumber: iosBuildNumber,
      associatedDomains: ["applinks:scrollthewheel.bohdanium.com"],
      infoPlist: {
        ...(base.ios?.infoPlist ?? {}),
        CFBundleDisplayName: storeListing.appName,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...base.android,
      versionCode: androidVersionCode,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "scrollthewheel.bohdanium.com",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    extra: {
      ...base.extra,
      ...(leaderboardApiUrl != null ? { leaderboardApiUrl } : {}),
      ...(leaderboardSubmitKey != null ? { leaderboardSubmitKey } : {}),
      aso: storeListing,
    },
  };
};
