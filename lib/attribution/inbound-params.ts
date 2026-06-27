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

/** True when /go has enough UTM params to log a visit (utm_source or utm_campaign). */
export function hasTrackableUtms(params: URLSearchParams): boolean {
  return Boolean(
    (params.get("utm_source") ?? "").trim() ||
      (params.get("utm_campaign") ?? "").trim(),
  );
}
