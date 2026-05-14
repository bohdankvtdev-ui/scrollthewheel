import { BebasNeue_400Regular, useFonts } from "@expo-google-fonts/bebas-neue";

/**
 * Registered in app `_layout.tsx` via `useFonts({ BebasNeue_400Regular })`.
 * [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) (Google Fonts).
 */
export const FONT_BEBAS_NEUE = "BebasNeue_400Regular" as const;

const fontMap = { BebasNeue_400Regular };

export function useBebasNeueFonts() {
  return useFonts(fontMap);
}
