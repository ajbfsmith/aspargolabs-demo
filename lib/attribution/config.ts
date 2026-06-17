import "server-only";

const LANDING_CAMPAIGN_SLUG = "aspargo-hezkue";

export function getBaskIntakeBaseUrl(): string {
  const url = process.env.BASK_INTAKE_BASE_URL?.trim();
  if (!url) {
    throw new Error("BASK_INTAKE_BASE_URL is not configured");
  }
  return url;
}

export function getBaskWebhookSecret(): string {
  return process.env.BASK_WEBHOOK_SECRET?.trim() ?? "";
}

export function getDefaultCampaignId(): string {
  const id = process.env.DEFAULT_CAMPAIGN_ID?.trim();
  if (!id) {
    throw new Error("DEFAULT_CAMPAIGN_ID is not configured");
  }
  return id;
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function isLandingCampaignSlug(slug: string | null | undefined): boolean {
  return (slug ?? "").trim() === LANDING_CAMPAIGN_SLUG;
}

export const LANDING_CTA_UTM = {
  source: "BF",
  medium: "landing",
  campaign: LANDING_CAMPAIGN_SLUG,
} as const;
