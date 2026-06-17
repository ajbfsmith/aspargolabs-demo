export const LANDING_CAMPAIGN_SLUG = "aspargo-hezkue";

/** Defaults for Aspargo landing CTAs — values must match Bask's allowed enums. */
export const LANDING_CTA_UTM = {
  source: "AFFILIATE",
  medium: "social",
  campaign: LANDING_CAMPAIGN_SLUG,
} as const;
