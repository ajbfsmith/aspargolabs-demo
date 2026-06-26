import type { InboundAttribution } from "@/lib/attribution/inbound-params";

/** Safe internal redirect target for /go (no open redirects). */
export function resolveDestPath(raw: string | null | undefined): string {
  const dest = (raw ?? "/").trim();
  if (!dest.startsWith("/") || dest.startsWith("//") || dest.includes("://")) {
    return "/";
  }
  return dest;
}

export function utmSourceForVisit(inbound: InboundAttribution): string {
  const source = (inbound.utm_source ?? "").trim();
  if (source) return source;
  const campaign = (inbound.utm_campaign ?? "").trim();
  if (campaign) return campaign;
  return "unknown";
}

export function buildAttributionVisitInput(input: {
  inbound: InboundAttribution;
  dest_path: string;
  referrer?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  visit_id?: string;
}) {
  const visited_at = new Date().toISOString();
  return {
    id: input.visit_id ?? crypto.randomUUID(),
    utm_source: utmSourceForVisit(input.inbound),
    utm_medium: input.inbound.utm_medium ?? null,
    utm_campaign: input.inbound.utm_campaign ?? null,
    utm_content: input.inbound.utm_content ?? null,
    utm_term: input.inbound.utm_term ?? null,
    dest_path: input.dest_path,
    referrer: input.referrer ?? null,
    visited_at,
    ip: input.ip ?? null,
    user_agent: input.user_agent ?? null,
  };
}
