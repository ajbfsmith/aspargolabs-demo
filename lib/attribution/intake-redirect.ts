import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getLinkClick, insertLinkClick } from "@/lib/attribution/attribution-store";
import { getBaskIntakeBaseUrl } from "@/lib/attribution/config";
import {
  buildBaskHandoffUtms,
  buildReferralParams,
} from "@/lib/attribution/bask-utm";
import { buildIntakeUrl } from "@/lib/attribution/utm";

export type MintIntakeRedirectInput = {
  campaign_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string | null;
  utm_content: string;
  utm_term?: string | null;
  is_simulation?: boolean;
  click_id?: string;
  request: Request;
};

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? null;
}

/** Log link_click (optional is_simulation) and 302 to Bask with clickId in utm_content. */
export async function mintIntakeRedirectResponse(
  input: MintIntakeRedirectInput,
): Promise<NextResponse> {
  const clickId = input.click_id ?? randomUUID();
  const existing = await getLinkClick(clickId);

  if (!existing) {
    await insertLinkClick({
      click_id: clickId,
      campaign_id: input.campaign_id,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      utm_content: input.utm_content,
      utm_term: input.utm_term,
      ip: clientIp(input.request),
      user_agent: input.request.headers.get("user-agent"),
      is_simulation: input.is_simulation ?? false,
    });
  }

  const baskBase = getBaskIntakeBaseUrl();
  const handoff = buildBaskHandoffUtms({
    clickId,
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
    marketing_content: input.utm_content,
    utm_term: input.utm_term,
  });
  const referral = buildReferralParams({
    utm_source: input.utm_source,
    utm_campaign: input.utm_campaign,
  });
  const dest = buildIntakeUrl(baskBase, handoff, referral);

  return NextResponse.redirect(dest, 302);
}
