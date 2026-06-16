import { NextResponse } from "next/server";
import { getBlogPostBySlugFromCms } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const post = await getBlogPostBySlugFromCms(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
