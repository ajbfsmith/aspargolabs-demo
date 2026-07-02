import { NextResponse } from "next/server";
import { confirmLinkClickAfterIntake } from "@/lib/attribution/confirm-link-click";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Parameters<
      typeof confirmLinkClickAfterIntake
    >[1];
    return confirmLinkClickAfterIntake(request, body);
  } catch (error) {
    console.error("[confirm-link-click]", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Confirm link click failed",
      },
      { status: 500 },
    );
  }
}
