import { buildRedirectUrl } from "@/lib/attribution/utm";
import { LANDING_CTA_UTM } from "@/lib/attribution/constants";
import { LANDING_CHECKOUT } from "@/lib/attribution/persona-checkout";

export type CtaPlacement = "hero" | "navbar" | "manifesto" | "faq";

export const CTA_LINK_LABELS: Record<CtaPlacement, string> = {
  hero: "Learn more about HEZKUE oral spray",
  navbar: "Learn more about HEZKUE",
  manifesto: "Buy HEZKUE oral spray",
  faq: "Learn more about HEZKUE treatment",
};

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  );
}

export function buildLandingCtaRedirectUrl(placement: CtaPlacement): string {
  const clickId = crypto.randomUUID();
  return buildRedirectUrl(siteUrl(), clickId, {
    campaign_id: LANDING_CHECKOUT.campaign_id,
    utm_source: LANDING_CTA_UTM.source,
    utm_medium: LANDING_CTA_UTM.medium,
    utm_campaign: LANDING_CTA_UTM.campaign,
    utm_content: placement,
  });
}

export function openLandingCta(placement: CtaPlacement): void {
  const url = buildLandingCtaRedirectUrl(placement);
  window.open(url, "_blank", "noopener,noreferrer");
}
