import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/app/data/blog-posts";
import { getSiteUrl } from "@/lib/attribution/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const posts = getPublishedPosts();

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
