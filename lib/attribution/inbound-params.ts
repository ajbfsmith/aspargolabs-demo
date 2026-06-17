export const INBOUND_ATTRIBUTION_KEY = "aspargo_inbound_attribution";

export type InboundAttribution = {
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  sd_click?: string;
};

export function parseInboundFromSearchParams(
  params: URLSearchParams,
): InboundAttribution | null {
  const campaign_id = params.get("campaign_id") ?? undefined;
  const utm_source = params.get("utm_source") ?? undefined;
  const utm_medium = params.get("utm_medium") ?? undefined;
  const utm_campaign = params.get("utm_campaign") ?? undefined;
  const utm_content = params.get("utm_content") ?? undefined;
  const utm_term = params.get("utm_term") ?? undefined;
  const sd_click = params.get("sd_click") ?? undefined;

  if (
    !campaign_id &&
    !utm_source &&
    !utm_campaign &&
    !sd_click
  ) {
    return null;
  }

  return {
    campaign_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    sd_click,
  };
}

export function saveInboundAttribution(data: InboundAttribution): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INBOUND_ATTRIBUTION_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

export function loadInboundAttribution(): InboundAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(INBOUND_ATTRIBUTION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InboundAttribution;
  } catch {
    return null;
  }
}
