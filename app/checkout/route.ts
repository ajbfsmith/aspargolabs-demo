import { NextResponse } from "next/server";
import { buildCheckoutRedirectPath } from "@/lib/attribution/checkout-redirect";
import { mintIntakeRedirectResponse } from "@/lib/attribution/intake-redirect";
import {
  CHECKOUT_PLATFORMS,
  isCheckoutPersona,
  parseCheckoutAccount,
  parseCheckoutPlatform,
  personaCheckoutAttribution,
} from "@/lib/attribution/persona-checkout";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const personaParam = url.searchParams.get("persona")?.trim().toLowerCase() ?? "";

  if (personaParam) {
    if (!isCheckoutPersona(personaParam)) {
      return NextResponse.json({ detail: "Unknown persona" }, { status: 404 });
    }

    const platform = parseCheckoutPlatform(url.searchParams);
    if (!platform) {
      const provided = (
        url.searchParams.get("platform") ??
        url.searchParams.get("utm_medium") ??
        ""
      ).trim();
      return NextResponse.json(
        {
          detail: provided
            ? `Invalid platform "${provided}". Use ?platform= one of: ${CHECKOUT_PLATFORMS.join(", ")}`
            : `platform query parameter is required with persona (?platform=${CHECKOUT_PLATFORMS[0]}, …)`,
        },
        { status: 400 },
      );
    }

    try {
      const attrs = personaCheckoutAttribution(
        personaParam,
        platform,
        parseCheckoutAccount(url.searchParams),
      );
      return mintIntakeRedirectResponse({
        request,
        campaign_id: attrs.campaign_id,
        utm_source: attrs.utm_source,
        utm_medium: attrs.utm_medium,
        utm_campaign: attrs.utm_campaign,
        utm_content: attrs.utm_content,
        utm_term: attrs.utm_term,
        is_simulation: false,
      });
    } catch (error) {
      console.error("[checkout] persona redirect failed:", error);
      return NextResponse.json(
        {
          detail:
            error instanceof Error
              ? error.message
              : "Persona checkout is not configured",
        },
        { status: 500 },
      );
    }
  }

  try {
    const path = buildCheckoutRedirectPath(request);
    return NextResponse.redirect(new URL(path, request.url), 302);
  } catch (error) {
    console.error("[checkout] redirect failed:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Checkout redirect is not configured",
      },
      { status: 500 },
    );
  }
}
