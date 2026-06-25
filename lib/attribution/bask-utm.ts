/**
 * Bask storefront UTM constraints (from Bask docs):
 *
 * Required:
 *   utm_source   — Bask enum (we always hand off AFFILIATE for this funnel)
 *   utm_campaign — campaign name slug
 *
 * Optional:
 *   utm_medium   — cpc | email | social
 *   utm_content  — ad creative identifier (we use click UUID for click→signup link)
 *   utm_term     — search keyword only (do not put click ids here)
 *
 * Hezkue Direct also accepts referral-campaign and referral-source on the intake URL.
 */

import {
  LANDING_CAMPAIGN_SLUG,
  LANDING_REFERRAL,
} from "@/lib/attribution/constants";
import type { ReferralParams } from "@/lib/attribution/utm";

const BASK_MEDIA = new Set(["cpc", "email", "social", "landing"]);

/** All marketing sources map to AFFILIATE at Bask; raw source stays in link_clicks. */
export function normalizeBaskUtmSource(
  raw: string | null | undefined,
): string {
  void raw;
  return "AFFILIATE";
}

/** Map inbound medium to Bask-accepted utm_medium (cpc | email | social). */
export function normalizeBaskUtmMedium(
  raw: string | null | undefined,
  fallback = "social",
): string {
  const key = (raw ?? "").trim().toLowerCase();
  if (BASK_MEDIA.has(key)) return key;
  if (key === "organic" || key === "dm") return "social";
  if (key === "paid" || key === "ppc") return "cpc";
  return fallback;
}

export type BaskIntakeUtms = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
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
  const rawSource = (input.utm_source ?? "").trim().toUpperCase();
  const slug = (input.utm_campaign ?? LANDING_CAMPAIGN_SLUG).trim();

  if (
    rawSource === "BF" ||
    rawSource === "LANDING" ||
    slug === LANDING_CAMPAIGN_SLUG
  ) {
    return { ...LANDING_REFERRAL };
  }

  const baskSource = normalizeBaskUtmSource(input.utm_source);
  return {
    campaign: referralCampaignFromSlug(slug),
    source: baskSource.toLowerCase(),
  };
}

/**
 * UTMs sent to the Bask questionnaire URL.
 * clickId goes in utm_content — Bask treats it as the creative identifier.
 */
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
    utm_source: normalizeBaskUtmSource(input.utm_source),
    utm_medium: normalizeBaskUtmMedium(input.utm_medium),
    utm_campaign: (input.utm_campaign ?? LANDING_CAMPAIGN_SLUG).trim(),
    utm_content: input.clickId,
    ...(term ? { utm_term: term } : {}),
  };
}
