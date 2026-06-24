import "server-only";

import { revalidatePath } from "next/cache";

const BLOG_PATHS = ["/sitemap.xml", "/blog", "/blog/[slug]"] as const;

export function revalidateBlogSurfaces(): string[] {
  revalidatePath("/sitemap.xml");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  return [...BLOG_PATHS];
}

export function getRevalidateSecret(): string {
  return process.env.REVALIDATE_SECRET?.trim() ?? "";
}

export function isValidRevalidateSecret(provided: string | null | undefined): boolean {
  const secret = getRevalidateSecret();
  if (!secret) return false;
  return provided === secret;
}
