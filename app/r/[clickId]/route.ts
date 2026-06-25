import "server-only";

import { NextResponse } from "next/server";
import {
  getLinkClick,
  insertLinkClick,
} from "@/lib/attribution/attribution-store";
import { getBaskIntakeBaseUrl } from "@/lib/attribution/config";
import {
  buildBaskHandoffUtms,
  buildReferralParams,
} from "@/lib/attribution/bask-utm";
import { buildIntakeUrl } from "@/lib/attribution/utm";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ clickId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { clickId } = await context.params;
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id")?.trim();

  if (!campaignId) {
    return NextResponse.json(
      { detail: "campaign_id query parameter is required" },
      { status: 400 },
    );
  }

  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium") ?? "organic";
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmContent = url.searchParams.get("utm_content");
  const inboundUtmTerm = url.searchParams.get("utm_term");

  const existing = await getLinkClick(clickId);
  if (!existing) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? null;
    const userAgent = request.headers.get("user-agent");

    await insertLinkClick({
      click_id: clickId,
      campaign_id: campaignId,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: inboundUtmTerm,
      ip,
      user_agent: userAgent,
    });
  }

  const baskBase = getBaskIntakeBaseUrl();
  const handoff = buildBaskHandoffUtms({
    clickId,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    marketing_content: utmContent,
    utm_term: inboundUtmTerm,
  });
  const referral = buildReferralParams({
    utm_source: utmSource,
    utm_campaign: utmCampaign,
  });
  const dest = buildIntakeUrl(baskBase, handoff, referral);

  return NextResponse.redirect(dest, 302);
}
