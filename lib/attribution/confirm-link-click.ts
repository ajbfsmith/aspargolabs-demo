import "server-only";

import { NextResponse } from "next/server";
import { getLinkClick, insertLinkClick } from "@/lib/attribution/attribution-store";
import { getAttributionConfirmSecret } from "@/lib/attribution/config";

export type ConfirmLinkClickBody = {
  click_id: string;
  campaign_id: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  questions_answered?: number;
};

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? null;
}

function verifyBearer(request: Request): NextResponse | null {
  const secret = getAttributionConfirmSecret();
  if (!secret) {
    return NextResponse.json(
      { detail: "Attribution confirm is not configured" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Log a deferred simulation link_click after successful Bask intake. */
export async function confirmLinkClickAfterIntake(
  request: Request,
  body: ConfirmLinkClickBody,
): Promise<NextResponse> {
  const authError = verifyBearer(request);
  if authError) return authError;

  const clickId = body.click_id?.trim();
  const campaignId = body.campaign_id?.trim();
  if (!clickId || !campaignId) {
    return NextResponse.json(
      { detail: "click_id and campaign_id are required" },
      { status: 400 },
    );
  }

  const questionsAnswered = Number(body.questions_answered ?? 0);
  if (!Number.isFinite(questionsAnswered) || questionsAnswered < 1) {
    return NextResponse.json(
      { detail: "questions_answered must be at least 1" },
      { status: 400 },
    );
  }

  const existing = await getLinkClick(clickId);
  if (existing) {
    return NextResponse.json({
      click_id: clickId,
      logged: true,
      already_exists: true,
    });
  }

  const row = await insertLinkClick({
    click_id: clickId,
    campaign_id: campaignId,
    utm_source: body.utm_source ?? null,
    utm_medium: body.utm_medium ?? null,
    utm_campaign: body.utm_campaign ?? null,
    utm_content: body.utm_content ?? null,
    utm_term: body.utm_term ?? null,
    ip: clientIp(request),
    user_agent: request.headers.get("user-agent"),
    is_simulation: true,
  });

  return NextResponse.json({
    click_id: row.id,
    clicked_at: row.clicked_at,
    logged: true,
    already_exists: false,
  });
}
