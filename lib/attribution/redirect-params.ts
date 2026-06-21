export type AttributedRedirectParams = {
  campaign_id: string;
  utm_source: string;
  utm_medium?: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
};

export function buildRedirectSearchParams(
  params: AttributedRedirectParams,
): URLSearchParams {
  const search = new URLSearchParams();
  search.set("campaign_id", params.campaign_id);
  search.set("utm_source", params.utm_source);
  search.set("utm_medium", params.utm_medium ?? "organic");
  search.set("utm_campaign", params.utm_campaign);
  if (params.utm_content) {
    search.set("utm_content", params.utm_content);
  }
  if (params.utm_term) {
    search.set("utm_term", params.utm_term);
  }
  return search;
}

export function buildRedirectPath(
  clickId: string,
  params: AttributedRedirectParams,
): string {
  const search = buildRedirectSearchParams(params);
  return `/r/${clickId}?${search.toString()}`;
}
