/** Legal / support contact — aligned with marketing site `spinpage`. */
export const LEGAL_CONTACT_EMAIL = "support@scrollthewheel.com";
export const LEGAL_PRIVACY_EMAIL = "privacy@scrollthewheel.com";

export const LEGAL_LAST_UPDATED = "May 19, 2026";

/** Live marketing site (privacy, terms, support, etc.). */
export const MARKETING_SITE_URL = "https://scrollthewheel.bohdanium.com";

export function marketingSitePath(path: string): string {
  const base = MARKETING_SITE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
