import { NextResponse } from "next/server";
import { listBlogPostsFromCms } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await listBlogPostsFromCms();
  return NextResponse.json({ posts });
}
