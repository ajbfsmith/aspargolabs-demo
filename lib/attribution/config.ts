import "server-only";

import { LANDING_CAMPAIGN_SLUG } from "@/lib/attribution/constants";

import { DEFAULT_HEZKUE_INTAKE_URL } from "@/lib/attribution/constants";

const DEFAULT_INTAKE_FORM_URL = DEFAULT_HEZKUE_INTAKE_URL;

export function getBaskIntakeBaseUrl(): string {
  const url =
    process.env.BASK_INTAKE_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_INTAKE_FORM_URL?.trim() ||
    DEFAULT_INTAKE_FORM_URL;
  if (!url) {
    throw new Error(
      "Bask intake URL not configured (set NEXT_PUBLIC_INTAKE_FORM_URL)",
    );
  }
  return url;
}

export function getBaskWebhookSecret(): string {
  return process.env.BASK_WEBHOOK_SECRET?.trim() ?? "";
}

export function getDefaultCampaignId(): string {
  const id = process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN_ID?.trim();
  if (!id) {
    throw new Error("NEXT_PUBLIC_DEFAULT_CAMPAIGN_ID is not configured");
  }
  return id;
}

import { LANDING_CHECKOUT } from "@/lib/attribution/persona-checkout";

export function getLandingCampaignId(): string {
  return LANDING_CHECKOUT.campaign_id;
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
