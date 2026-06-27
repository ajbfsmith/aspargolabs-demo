/** Persona slugs for /checkout?persona=…&platform=… */
export const CHECKOUT_PERSONAS = [
  "gymbro",
  "young-lady",
  "old-lady",
  "science-guy",
  "meme",
] as const;

export type CheckoutPersona = (typeof CHECKOUT_PERSONAS)[number];

/** Platforms accepted on /checkout?platform=… (stored as utm_medium). */
export const CHECKOUT_PLATFORMS = [
  "x",
  "reddit",
  "facebook",
  "instagram",
  "tiktok",
  "bluesky",
  "threads",
  "youtube",
] as const;

export type CheckoutPlatform = (typeof CHECKOUT_PLATFORMS)[number];

const UTM_SOURCE = "AFFILIATE";
const UTM_CONTENT = "link-in-bio";

/**
 * Social Dash campaign UUIDs + Bask utm_campaign slugs.
 * Synced from docs/hezkue_persona_campaigns.json (setup_hezkue_persona_campaigns.py).
 */
export const PERSONA_CHECKOUT: Record<
  CheckoutPersona,
  { campaign_id: string; utm_campaign: string }
> = {
  gymbro: {
    campaign_id: "e5d65151-a3e8-48e5-84ca-e6cd899ee3d1",
    utm_campaign: "bf-hezkue-gymbro",
  },
  "young-lady": {
    campaign_id: "6870ca18-de76-4f13-80ed-9964f5cfd326",
    utm_campaign: "bf-hezkue-young-lady",
  },
  "old-lady": {
    campaign_id: "d229d2cb-2e50-456c-8e34-c09b51a3559d",
    utm_campaign: "bf-hezkue-old-lady",
  },
  "science-guy": {
    campaign_id: "6a8bde55-de8f-472d-8025-44d93bf051a3",
    utm_campaign: "bf-hezkue-science-guy",
  },
  meme: {
    campaign_id: "7aae963c-f4df-4925-93f2-4cea2a12965c",
    utm_campaign: "bf-hezkue-meme",
  },
};

/** Landing site CTAs (/checkout without persona). */
export const LANDING_CHECKOUT = {
  campaign_id: "fed96c9a-97ce-4d43-a556-30d3d45f1212",
  utm_campaign: "bf-hezkue-landing",
} as const;

export function isCheckoutPersona(value: string): value is CheckoutPersona {
  return (CHECKOUT_PERSONAS as readonly string[]).includes(value);
}

export function isCheckoutPlatform(value: string): value is CheckoutPlatform {
  return (CHECKOUT_PLATFORMS as readonly string[]).includes(value);
}

export function personaCheckoutAttribution(
  slug: CheckoutPersona,
  platform: CheckoutPlatform,
  account?: string | null,
) {
  const cfg = PERSONA_CHECKOUT[slug];
  const term = (account ?? "").trim() || null;
  return {
    campaign_id: cfg.campaign_id,
    utm_source: UTM_SOURCE,
    utm_medium: platform,
    utm_campaign: cfg.utm_campaign,
    utm_content: UTM_CONTENT,
    utm_term: term,
  };
}

export function parseCheckoutPlatform(
  params: URLSearchParams,
): CheckoutPlatform | null {
  const raw = (
    params.get("platform") ??
    params.get("utm_medium") ??
    ""
  )
    .trim()
    .toLowerCase();
  if (!raw) return null;
  return isCheckoutPlatform(raw) ? raw : null;
}

export function parseCheckoutAccount(params: URLSearchParams): string | null {
  const raw = (params.get("account") ?? params.get("utm_term") ?? "").trim();
  return raw || null;
}
