export type UtmParams = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
};

export function buildIntakeUrl(
  baseUrl: string,
  utms: UtmParams,
  sdClick?: string | null,
): string {
  const base = baseUrl.trim();
  if (!base) return "";

  const url = new URL(base);
  url.searchParams.set("utm_source", utms.utm_source);
  url.searchParams.set("utm_medium", utms.utm_medium);
  url.searchParams.set("utm_campaign", utms.utm_campaign);
  if (utms.utm_content) {
    url.searchParams.set("utm_content", utms.utm_content);
  }
  if (utms.utm_term) {
    url.searchParams.set("utm_term", utms.utm_term);
  }
  if (sdClick) {
    url.searchParams.set("sd_click", sdClick);
  }
  return url.toString();
}

export function buildRedirectUrl(
  redirectBase: string,
  clickId: string,
  params: {
    campaign_id: string;
    utm_source: string;
    utm_medium?: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
  },
): string {
  const base = redirectBase.trim().replace(/\/$/, "");
  if (!base || !clickId) return "";

  const url = new URL(`${base}/r/${clickId}`);
  url.searchParams.set("campaign_id", params.campaign_id);
  url.searchParams.set("utm_source", params.utm_source);
  url.searchParams.set("utm_medium", params.utm_medium ?? "organic");
  url.searchParams.set("utm_campaign", params.utm_campaign);
  if (params.utm_content) {
    url.searchParams.set("utm_content", params.utm_content);
  }
  if (params.utm_term) {
    url.searchParams.set("utm_term", params.utm_term);
  }
  return url.toString();
}
