export const LANDING_CAMPAIGN_SLUG = "bf-hezkue";

/** Campaign slug on all site CTAs → Bask intake. */
export const LANDING_INTAKE_CAMPAIGN_SLUG = "bf-hezkue-landing";

/** Hezkue Direct questionnaire entry (Bask storefront). */
export const DEFAULT_HEZKUE_INTAKE_URL =
  "https://go.hezkuedirect.com/start-online-visit/ed?referral-campaign=/bf&referral-source=affiliate";

/** Default referral query params for Aspargo landing → Hezkue. */
export const LANDING_REFERRAL = {
  campaign: "/bf",
  source: "affiliate",
} as const;

/** Defaults for Aspargo landing CTAs (same values stored and sent to Bask). */
export const LANDING_CTA_UTM = {
  source: "AFFILIATE",
  medium: "landing",
  campaign: LANDING_INTAKE_CAMPAIGN_SLUG,
} as const;