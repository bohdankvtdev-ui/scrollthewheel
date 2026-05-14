import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { useBebasNeueFonts } from "../theme/fonts";

void SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash may be unavailable in some environments */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useBebasNeueFonts();

  useEffect(() => {
    if (fontsLoaded || fontError != null) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && fontError == null) {
    return <View style={{ flex: 1, backgroundColor: "#4A2574" }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

