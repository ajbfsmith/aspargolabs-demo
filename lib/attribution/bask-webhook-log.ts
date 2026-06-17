import "server-only";

const PREFIX = "[bask-webhook]";

export function baskWebhookLog(
  requestId: string,
  step: string,
  detail?: Record<string, unknown>,
): void {
  const payload = {
    requestId,
    step,
    at: new Date().toISOString(),
    ...detail,
  };
  console.log(PREFIX, JSON.stringify(payload));
}

export function baskWebhookError(
  requestId: string,
  step: string,
  err: unknown,
  detail?: Record<string, unknown>,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(
    PREFIX,
    JSON.stringify({
      requestId,
      step,
      at: new Date().toISOString(),
      error: message,
      stack,
      ...detail,
    }),
  );
}

export function supabaseEnvSnapshot(): Record<string, unknown> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  let supabaseHost = "";
  try {
    supabaseHost = url ? new URL(url).host : "";
  } catch {
    supabaseHost = "invalid-url";
  }
  return {
    supabaseHost,
    supabaseUrlConfigured: Boolean(url),
    serviceRoleConfigured: Boolean(serviceKey),
    serviceRoleLength: serviceKey.length,
    isPlaceholderUrl: url.includes("YOUR_PROJECT"),
  };
}

export function safeHeaderSnapshot(headers: Headers): Record<string, unknown> {
  const auth = headers.get("authorization") ?? "";
  return {
    contentType: headers.get("content-type") ?? "",
    userAgent: headers.get("user-agent") ?? "",
    host: headers.get("host") ?? "",
    authorizationPresent: Boolean(auth),
    authorizationPrefix: auth.slice(0, 12),
    authorizationLength: auth.length,
  };
}
