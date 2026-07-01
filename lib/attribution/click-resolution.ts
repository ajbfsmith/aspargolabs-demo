import "server-only";

import {
  findRecentUnlinkedClick,
  getLinkClick,
} from "@/lib/attribution/attribution-store";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function strId(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

export type WebhookUtms = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

/** Minimum UTM signal required before fuzzy-matching an unlinked click. */
export function hasFuzzyClickMatchCriteria(
  utms: WebhookUtms,
  campaignId?: string | null,
): boolean {
  if ((campaignId ?? "").trim()) return true;
  if ((utms.utm_campaign ?? "").trim()) return true;
  if ((utms.utm_source ?? "").trim() && (utms.utm_medium ?? "").trim()) {
    return true;
  }
  if ((utms.utm_content ?? "").trim()) return true;
  return false;
}

/**
 * Resolve click id from explicit Bask params only (sd_click or click UUID in utm_*).
 * Never fuzzy-matches recent unlinked clicks.
 */
export async function resolveExplicitClickIdFromWebhook(
  params: Record<string, unknown>,
): Promise<string | null> {
  for (const key of ["sd_click", "sd_click_id"]) {
    const raw = strId(params[key]);
    if (!raw) continue;
    const click = await getLinkClick(raw);
    if (click) return raw;
  }

  for (const key of ["utm_content", "utm_term"]) {
    const raw = strId(params[key]);
    if (!raw || !UUID_RE.test(raw)) continue;
    const click = await getLinkClick(raw);
    if (click) return raw;
  }

  return null;
}

/**
 * Resolve a logged link_clicks.id from Bask signUpSearchParams.
 *
 * Order: sd_click → utm_content/utm_term UUID → fuzzy match on UTMs (48h, non-simulation).
 * Fuzzy match requires at least campaign_id, utm_campaign, utm_source+utm_medium, or utm_content.
 */
export async function resolveClickIdFromWebhook(
  params: Record<string, unknown>,
  options: { campaign_id?: string | null; utms: WebhookUtms },
): Promise<string | null> {
  const explicit = await resolveExplicitClickIdFromWebhook(params);
  if (explicit) return explicit;

  if (!hasFuzzyClickMatchCriteria(options.utms, options.campaign_id)) {
    return null;
  }

  return findRecentUnlinkedClick({
    campaign_id: options.campaign_id,
    utm_source: options.utms.utm_source,
    utm_medium: options.utms.utm_medium,
    utm_campaign: options.utms.utm_campaign,
    utm_content: options.utms.utm_content,
  });
}
