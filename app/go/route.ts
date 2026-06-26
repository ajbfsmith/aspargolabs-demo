import "server-only";

import { NextResponse } from "next/server";
import { insertAttributionVisit } from "@/lib/attribution/attribution-store";
import {
  buildAttributionVisitInput,
  resolveDestPath,
} from "@/lib/attribution/go-redirect";
import {
  hasTrackableUtms,
  parseInboundFromSearchParams,
} from "@/lib/attribution/inbound-params";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!hasTrackableUtms(url.searchParams)) {
    return NextResponse.json(
      { detail: "utm_source or utm_campaign query parameter is required" },
      { status: 400 },
    );
  }

  const inbound = parseInboundFromSearchParams(url.searchParams);
  if (!inbound) {
    return NextResponse.json(
      { detail: "utm_source or utm_campaign query parameter is required" },
      { status: 400 },
    );
  }

  const destPath = resolveDestPath(url.searchParams.get("dest"));
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  const visit = buildAttributionVisitInput({
    inbound,
    dest_path: destPath,
    referrer,
    ip,
    user_agent: userAgent,
  });

  await insertAttributionVisit(visit);

  return NextResponse.redirect(new URL(destPath, url.origin), 302);
}
