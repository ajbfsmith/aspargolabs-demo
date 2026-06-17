import { NextResponse } from "next/server";
import { processBaskWebhookBody } from "@/lib/attribution/bask-processor";
import { getBaskWebhookSecret } from "@/lib/attribution/config";
import {
  baskWebhookError,
  baskWebhookLog,
  safeHeaderSnapshot,
  supabaseEnvSnapshot,
} from "@/lib/attribution/bask-webhook-log";

export const dynamic = "force-dynamic";

function verifyBearer(
  request: Request,
  requestId: string,
): NextResponse | null {
  const secret = getBaskWebhookSecret();
  if (!secret) {
    baskWebhookLog(requestId, "auth.skipped", {
      reason: "BASK_WEBHOOK_SECRET unset",
    });
    return null;
  }
  const auth = request.headers.get("authorization") ?? "";
  const ok = auth === `Bearer ${secret}`;
  baskWebhookLog(requestId, "auth.check", {
    ok,
    expectedBearerLength: `Bearer ${secret}`.length,
    receivedAuthorizationLength: auth.length,
  });
  if (!ok) {
    return NextResponse.json(
      { detail: "Invalid webhook authorization", requestId },
      { status: 401 },
    );
  }
  return null;
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    auth_configured: Boolean(getBaskWebhookSecret()),
    supabase: supabaseEnvSnapshot(),
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  baskWebhookLog(requestId, "request.received", {
    method: request.method,
    url: request.url,
    headers: safeHeaderSnapshot(request.headers),
    supabase: supabaseEnvSnapshot(),
  });

  const authError = verifyBearer(request, requestId);
  if (authError) return authError;

  const rawText = await request.text();
  baskWebhookLog(requestId, "request.rawBody", {
    rawLength: rawText.length,
    rawBody: rawText,
  });

  let body: unknown;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch (err) {
    baskWebhookError(requestId, "request.jsonParseFailed", err, { rawText });
    return NextResponse.json(
      { detail: "Invalid JSON", requestId },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    baskWebhookLog(requestId, "request.invalidBodyType", {
      bodyType: body === null ? "null" : typeof body,
      body,
    });
    return NextResponse.json(
      { detail: "Expected JSON object", requestId },
      { status: 400 },
    );
  }

  baskWebhookLog(requestId, "request.parsedBody", {
    topLevelKeys: Object.keys(body as Record<string, unknown>),
    body,
  });

  try {
    const result = await processBaskWebhookBody(
      body as Record<string, unknown>,
      requestId,
    );
    baskWebhookLog(requestId, "response.ok", { result });
    return NextResponse.json({ requestId, ...result });
  } catch (err) {
    baskWebhookError(requestId, "response.failed", err);
    return NextResponse.json(
      {
        detail: "Webhook processing failed",
        requestId,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
