/**
 * Bask storefront UTM params.
 *
 * link_clicks stores marketing UTMs; Bask handoff puts clickId in utm_content.
 *
 * Required:
 *   utm_source   — AFFILIATE
 *   utm_campaign — campaign slug
 *
 * Optional:
 *   utm_medium   — landing | x | reddit | instagram | tiktok | …
 *   utm_content  — click UUID at Bask (marketing label stored in link_clicks)
 *   utm_term     — keyword or handle
 *
 * Hezkue Direct also accepts referral-campaign and referral-source on the intake URL.
 */

import {
  LANDING_CAMPAIGN_SLUG,
  LANDING_INTAKE_CAMPAIGN_SLUG,
  LANDING_REFERRAL,
} from "@/lib/attribution/constants";
import type { ReferralParams } from "@/lib/attribution/utm";

export type BaskIntakeUtms = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
};

function referralCampaignFromSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return LANDING_REFERRAL.campaign;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Hezkue referral-* params paired with Bask UTMs on the intake URL. */
export function buildReferralParams(input: {
  utm_source?: string | null;
  utm_campaign?: string | null;
}): ReferralParams {
  const slug = (input.utm_campaign ?? LANDING_CAMPAIGN_SLUG).trim();

  if (slug === LANDING_CAMPAIGN_SLUG) {
    return { ...LANDING_REFERRAL };
  }

  const source = (input.utm_source ?? "AFFILIATE").trim().toLowerCase();
  return {
    campaign: referralCampaignFromSlug(slug),
    source,
  };
}

/** UTMs sent to the Bask questionnaire URL. clickId goes in utm_content for signup attribution. */
export function buildBaskHandoffUtms(input: {
  clickId: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  /** Marketing creative label stored on link_clicks (hero, post id, …). */
  marketing_content?: string | null;
  utm_term?: string | null;
}): BaskIntakeUtms {
  const term = (input.utm_term ?? "").trim();
  return {
    utm_source: (input.utm_source ?? "AFFILIATE").trim(),
    utm_medium: (input.utm_medium ?? "landing").trim(),
    utm_campaign: (input.utm_campaign ?? LANDING_INTAKE_CAMPAIGN_SLUG).trim(),
    utm_content: input.clickId,
    ...(term ? { utm_term: term } : {}),
  };
}
