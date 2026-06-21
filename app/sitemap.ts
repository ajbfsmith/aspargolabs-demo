import type { MetadataRoute } from "next";
import { listBlogPostsFromCms } from "@/lib/blog/repository";
import { getSiteUrl } from "@/lib/attribution/config";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const posts = await listBlogPostsFromCms();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.lastReviewedAt ?? post.date),
      changeFrequency: "monthly" as const,
      priority: post.isPillar ? 0.9 : 0.7,
    })),
  ];
}
