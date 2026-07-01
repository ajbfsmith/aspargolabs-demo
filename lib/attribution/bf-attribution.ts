import "server-only";

import { getLinkClick } from "@/lib/attribution/attribution-store";
import { resolveExplicitClickIdFromWebhook } from "@/lib/attribution/click-resolution";
import type { WebhookUtms } from "@/lib/attribution/click-resolution";
import {
  LANDING_CHECKOUT,
  PERSONA_CHECKOUT,
} from "@/lib/attribution/persona-checkout";

export const BF_HEZKUE_CAMPAIGN_IDS = new Set<string>([
  LANDING_CHECKOUT.campaign_id,
  ...Object.values(PERSONA_CHECKOUT).map((cfg) => cfg.campaign_id),
]);

function strId(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

/** True when utm_campaign is `bf-hezkue` or `bf-hezkue-*`. */
export function isBfHezkueUtmCampaign(
  slug: string | null | undefined,
): boolean {
  const normalized = (slug ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized === "bf-hezkue" || normalized.startsWith("bf-hezkue-");
}

export function isBfHezkueCampaignId(id: string | null | undefined): boolean {
  const normalized = (id ?? "").trim();
  if (!normalized) return false;
  return BF_HEZKUE_CAMPAIGN_IDS.has(normalized);
}

export function hasBfHezkueAttributionInParams(
  params: Record<string, unknown>,
  utms: WebhookUtms,
): boolean {
  if (isBfHezkueUtmCampaign(utms.utm_campaign)) return true;
  if (isBfHezkueCampaignId(strId(params.campaign_id))) return true;
  return false;
}

/** Whether a Bask webhook should be stored (bf-hezkue attribution only). */
export async function isBfHezkueAttributedWebhook(
  params: Record<string, unknown>,
  utms: WebhookUtms,
): Promise<boolean> {
  if (hasBfHezkueAttributionInParams(params, utms)) return true;

  const clickId = await resolveExplicitClickIdFromWebhook(params);
  if (!clickId) return false;

  const click = await getLinkClick(clickId);
  return isBfHezkueUtmCampaign(click?.utm_campaign);
}
