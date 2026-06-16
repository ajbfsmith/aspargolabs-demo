import { createClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { seedBlogPosts } from "../lib/blog/seed-posts";

loadEnv({ path: ".env" });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createWriteClient() {
  return createClient({
    projectId: requireEnv("SANITY_PROJECT_ID"),
    dataset: process.env.SANITY_DATASET?.trim() || "production",
    apiVersion: process.env.SANITY_API_VERSION?.trim() || "2024-01-01",
    token: requireEnv("SANITY_API_WRITE_TOKEN"),
    useCdn: false,
  });
}

function toSanityDocument(post: (typeof seedBlogPosts)[number]) {
  return {
    _id: `post-${post.slug}`,
    _type: "post" as const,
    title: post.title,
    slug: { _type: "slug" as const, current: post.slug },
    excerpt: post.excerpt,
    publishedAt: post.date,
    readTime: post.readTime,
    tag: post.tag,
    coverColor: post.coverColor,
    content: post.content.trim(),
  };
}

async function main() {
  const client = createWriteClient();
  const transaction = client.transaction();

  for (const post of seedBlogPosts) {
    transaction.createOrReplace(toSanityDocument(post));
  }

  await transaction.commit();
  console.log(`[sanity:seed] Seeded ${seedBlogPosts.length} blog posts.`);
}

main().catch((error) => {
  console.error("[sanity:seed] Failed:", error);
  process.exit(1);
});
