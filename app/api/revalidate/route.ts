import { NextResponse } from "next/server";
import {
  getRevalidateSecret,
  isValidRevalidateSecret,
  revalidateBlogSurfaces,
} from "@/lib/blog/revalidate";

export const dynamic = "force-dynamic";

function readSecret(request: Request): string | null {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret) return querySecret;

  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim();
  }

  return null;
}

function unauthorized() {
  return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
}

function notConfigured() {
  return NextResponse.json(
    {
      ok: false,
      detail: "REVALIDATE_SECRET is not configured",
    },
    { status: 503 },
  );
}

/** Health check — does not revalidate. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const shouldRevalidate = url.searchParams.has("secret");

  if (!shouldRevalidate) {
    return NextResponse.json({
      ok: true,
      configured: Boolean(getRevalidateSecret()),
      paths: ["/sitemap.xml", "/blog", "/blog/[slug]"],
    });
  }

  if (!getRevalidateSecret()) return notConfigured();
  if (!isValidRevalidateSecret(readSecret(request))) return unauthorized();

  const revalidated = revalidateBlogSurfaces();
  return NextResponse.json({
    ok: true,
    revalidated,
    revalidatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  if (!getRevalidateSecret()) return notConfigured();
  if (!isValidRevalidateSecret(readSecret(request))) return unauthorized();

  const revalidated = revalidateBlogSurfaces();
  return NextResponse.json({
    ok: true,
    revalidated,
    revalidatedAt: new Date().toISOString(),
  });
}
