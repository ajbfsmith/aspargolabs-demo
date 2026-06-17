import { buildRedirectUrl } from "@/lib/attribution/utm";
import { LANDING_CTA_UTM } from "@/lib/attribution/constants";
import type { InboundAttribution } from "@/lib/attribution/inbound-params";

export type CtaPlacement = "hero" | "navbar" | "manifesto" | "faq";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  );
}

function defaultCampaignId(): string {
  const id = process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN_ID?.trim();
  if (!id) {
    console.warn("NEXT_PUBLIC_DEFAULT_CAMPAIGN_ID is not set");
    return "";
  }
  return id;
}

export function buildLandingCtaRedirectUrl(
  placement: CtaPlacement,
  inbound?: InboundAttribution | null,
): string {
  const campaignId = inbound?.campaign_id ?? defaultCampaignId();
  if (!campaignId) return "#";

  const clickId = crypto.randomUUID();
  return buildRedirectUrl(siteUrl(), clickId, {
    campaign_id: campaignId,
    utm_source: inbound?.utm_source ?? LANDING_CTA_UTM.source,
    utm_medium: inbound?.utm_medium ?? LANDING_CTA_UTM.medium,
    utm_campaign: inbound?.utm_campaign ?? LANDING_CTA_UTM.campaign,
    utm_content: placement,
    utm_term: inbound?.utm_term,
  });
}

export function openLandingCta(
  placement: CtaPlacement,
  inbound?: InboundAttribution | null,
): void {
  const url = buildLandingCtaRedirectUrl(placement, inbound);
  if (url === "#") return;
  window.open(url, "_blank", "noopener,noreferrer");
}
