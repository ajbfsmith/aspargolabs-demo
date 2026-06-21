import { NextResponse } from "next/server";
import { buildCheckoutRedirectPath } from "@/lib/attribution/checkout-redirect";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
