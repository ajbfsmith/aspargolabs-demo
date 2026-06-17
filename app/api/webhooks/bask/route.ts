import { NextResponse } from "next/server";
import { processBaskWebhookBody } from "@/lib/attribution/bask-processor";
import { getBaskWebhookSecret } from "@/lib/attribution/config";

export const dynamic = "force-dynamic";

function verifyBearer(request: Request): NextResponse | null {
  const secret = getBaskWebhookSecret();
  if (!secret) {
    console.warn("BASK_WEBHOOK_SECRET unset — accepting webhooks without auth");
    return null;
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { detail: "Invalid webhook authorization" },
      { status: 401 },
    );
  }
  return null;
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    auth_configured: Boolean(getBaskWebhookSecret()),
  });
}

export async function POST(request: Request) {
  const authError = verifyBearer(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ detail: "Expected JSON object" }, { status: 400 });
  }

  try {
    const result = await processBaskWebhookBody(body as Record<string, unknown>);
    return NextResponse.json({ status: "accepted", ...result });
  } catch (err) {
    console.error("[bask-webhook]", err);
    return NextResponse.json(
      { detail: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
