import "server-only";

import { randomUUID } from "node:crypto";
import { getDefaultCampaignId } from "@/lib/attribution/config";
import { LANDING_CTA_UTM } from "@/lib/attribution/constants";
import { parseInboundFromSearchParams } from "@/lib/attribution/inbound-params";
import { buildRedirectPath } from "@/lib/attribution/redirect-params";

const BLOG_SLUG_RE = /^\/blog\/([a-z0-9-]+)\/?$/i;

function blogSlugFromReferer(referer: string | null): string | undefined {
  if (!referer) return undefined;
  try {
    const match = new URL(referer).pathname.match(BLOG_SLUG_RE);
    return match?.[1];
  } catch {
    return undefined;
  }
}

export function resolveCheckoutPostSlug(
  request: Request,
): string | undefined {
  const url = new URL(request.url);
  const explicit = url.searchParams.get("post")?.trim();
  if (explicit) return explicit;
  return blogSlugFromReferer(request.headers.get("referer"));
}

/**
 * Mint a unique click id and return the internal /r/{clickId} path with UTMs.
 * The /r handler logs the click and redirects to Bask intake.
 */
export function buildCheckoutRedirectPath(request: Request): string {
  const url = new URL(request.url);
  const inbound = parseInboundFromSearchParams(url.searchParams);
  const postSlug = resolveCheckoutPostSlug(request);
  const campaignId = inbound?.campaign_id ?? getDefaultCampaignId();
  const clickId = randomUUID();
  const placement = postSlug ? `blog:${postSlug}` : "checkout";

  return buildRedirectPath(clickId, {
    campaign_id: campaignId,
    utm_source: inbound?.utm_source ?? LANDING_CTA_UTM.source,
    utm_medium: inbound?.utm_medium ?? LANDING_CTA_UTM.medium,
    utm_campaign: inbound?.utm_campaign ?? LANDING_CTA_UTM.campaign,
    utm_content: placement,
    utm_term: inbound?.utm_term ?? postSlug,
  });
}
