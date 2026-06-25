export const LANDING_CAMPAIGN_SLUG = "bf-hezkue";

/** Hezkue Direct questionnaire entry (Bask storefront). */
export const DEFAULT_HEZKUE_INTAKE_URL =
  "https://go.hezkuedirect.com/start-online-visit/ed?referral-campaign=/bf&referral-source=affiliate";

/** Default referral query params for Aspargo landing → Hezkue. */
export const LANDING_REFERRAL = {
  campaign: "/bf",
  source: "affiliate",
} as const;

/** Defaults for Aspargo landing CTAs (normalized to Bask enums at handoff). */
export const LANDING_CTA_UTM = {
  source: "landing",
  medium: "landing",
  campaign: LANDING_CAMPAIGN_SLUG,
} as const;