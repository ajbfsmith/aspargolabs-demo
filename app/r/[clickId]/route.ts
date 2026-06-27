import "server-only";

import { NextResponse } from "next/server";
import { mintIntakeRedirectResponse } from "@/lib/attribution/intake-redirect";

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

  const isSimulation = url.searchParams.get("sim") === "1";

  return mintIntakeRedirectResponse({
    request,
    click_id: clickId,
    campaign_id: campaignId,
    utm_source: url.searchParams.get("utm_source") ?? "AFFILIATE",
    utm_medium: url.searchParams.get("utm_medium") ?? "organic",
    utm_campaign: url.searchParams.get("utm_campaign"),
    utm_content: url.searchParams.get("utm_content") ?? "link",
    utm_term: url.searchParams.get("utm_term"),
    is_simulation: isSimulation,
  });
}
