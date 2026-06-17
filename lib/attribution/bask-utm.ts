/**
 * Bask storefront UTM constraints (from Bask docs):
 *
 * Required:
 *   utm_source   — GOOGLE | META | TIKTOK | AFFILIATE | INFLUENCER
 *   utm_campaign — campaign name slug
 *
 * Optional:
 *   utm_medium   — cpc | email | social
 *   utm_content  — ad creative identifier (we use click UUID for click→signup link)
 *   utm_term     — search keyword only (do not put click ids here)
 */

const BASK_SOURCES = new Set([
  "GOOGLE",
  "META",
  "TIKTOK",
  "AFFILIATE",
  "INFLUENCER",
]);

const BASK_MEDIA = new Set(["cpc", "email", "social"]);

const SOURCE_ALIASES: Record<string, string> = {
  BF: "INFLUENCER",
  BLACKFORGE: "INFLUENCER",
  ASPARGO: "INFLUENCER",
  GOOGLE: "GOOGLE",
  META: "META",
  FACEBOOK: "META",
  INSTAGRAM: "META",
  TIKTOK: "TIKTOK",
  AFFILIATE: "AFFILIATE",
  INFLUENCER: "INFLUENCER",
  REDDIT: "AFFILIATE",
  BLUESKY: "AFFILIATE",
  THREADS: "META",
};

/** Map inbound / marketing labels to a Bask-accepted utm_source. */
export function normalizeBaskUtmSource(
  raw: string | null | undefined,
  fallback = "INFLUENCER",
): string {
  const key = (raw ?? "").trim().toUpperCase();
  if (BASK_SOURCES.has(key)) return key;
  return SOURCE_ALIASES[key] ?? fallback;
}

/** Map inbound medium to Bask-accepted utm_medium (cpc | email | social). */
export function normalizeBaskUtmMedium(
  raw: string | null | undefined,
  fallback = "social",
): string {
  const key = (raw ?? "").trim().toLowerCase();
  if (BASK_MEDIA.has(key)) return key;
  if (key === "organic" || key === "landing" || key === "dm") return "social";
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
    utm_campaign: (input.utm_campaign ?? "aspargo-hezkue").trim(),
    utm_content: input.clickId,
    ...(term ? { utm_term: term } : {}),
  };
}
