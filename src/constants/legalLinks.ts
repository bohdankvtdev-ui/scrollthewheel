import type { ComponentProps } from "react";
import type { MaterialIcons } from "@expo/vector-icons";
import { marketingSitePath } from "./legal";

export type LegalLinkItem = {
  id: string;
  label: string;
  /** In-app Expo Router path (only when no public web page). */
  route?: `/${string}`;
  /** Opens in browser — marketing site. */
  url?: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
};

/** Hub links shown on About and footers of legal screens. */
export const LEGAL_LINK_ITEMS: LegalLinkItem[] = [
  { id: "about", label: "About", route: "/about", icon: "info-outline" },
  { id: "privacy", label: "Privacy Policy", url: marketingSitePath("/privacy"), icon: "privacy-tip" },
  { id: "terms", label: "Terms of Service", url: marketingSitePath("/terms"), icon: "gavel" },
  { id: "cookies", label: "Cookie Policy", url: marketingSitePath("/cookies"), icon: "cookie" },
  { id: "credits", label: "Credits", route: "/credits", icon: "favorite-border" },
  { id: "support", label: "Support & FAQ", url: marketingSitePath("/support"), icon: "help-outline" },
  { id: "website", label: "Website", url: marketingSitePath("/"), icon: "language" },
];

export function legalLinksExcept(options?: { excludeId?: string; excludeRoute?: string }): LegalLinkItem[] {
  const { excludeId, excludeRoute } = options ?? {};
  return LEGAL_LINK_ITEMS.filter(
    (item) => item.id !== excludeId && item.route !== excludeRoute
  );
}
