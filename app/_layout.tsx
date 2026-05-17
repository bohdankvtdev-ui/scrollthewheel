import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { ScreenTexture } from "../src/components/ScreenTexture";
import { useAppBootstrap } from "../src/hooks/useAppBootstrap";

void SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash may be unavailable in some environments */
});

export default function RootLayout() {
  const ready = useAppBootstrap();

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: "#4A2574" }} />;
  }

  return (
    <ScreenTexture>
      <Stack screenOptions={{ headerShown: false }} />
    </ScreenTexture>
  );
}

