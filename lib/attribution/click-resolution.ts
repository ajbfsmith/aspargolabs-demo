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

/**
 * Resolve a logged link_clicks.id from Bask signUpSearchParams.
 *
 * Bask echoes utm_* but not sd_click. Click id is carried in utm_content.
 * We try: sd_click, utm_content (click uuid), utm_term if uuid,
 * then recent unlinked click with matching normalized UTMs (48h).
 */
export async function resolveClickIdFromWebhook(
  params: Record<string, unknown>,
  options: { campaign_id?: string | null; utms: WebhookUtms },
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

  return findRecentUnlinkedClick({
    campaign_id: options.campaign_id,
    utm_source: options.utms.utm_source,
    utm_medium: options.utms.utm_medium,
    utm_campaign: options.utms.utm_campaign,
  });
}
