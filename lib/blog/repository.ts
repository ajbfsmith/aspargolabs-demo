import "server-only";

import type { BlogPost } from "@/app/data/blog-types";
import { mapSanityPostsToBlogPosts } from "@/lib/blog/map-post";
import {
  fetchBlogPostBySlugFromSanity,
  fetchBlogPostsFromSanity,
  fetchPublishedBlogPostBySlugFromSanity,
  fetchPublishedBlogPostsFromSanity,
} from "@/lib/blog/queries";
import { seedBlogPosts } from "@/lib/blog/seed-posts";
import { createSanityClient } from "@/lib/sanity/client";
import { hasSanityConfig } from "@/lib/sanity/env";

export async function listBlogPostsFromCms(): Promise<BlogPost[]> {
  if (!hasSanityConfig()) {
    return seedBlogPosts;
  }

  try {
    const client = createSanityClient();
    const records = await fetchPublishedBlogPostsFromSanity(client);
    if (!records.length) {
      return seedBlogPosts;
    }
    return mapSanityPostsToBlogPosts(records);
  } catch (error) {
    console.error("[blog] Failed to fetch posts from Sanity:", error);
    return seedBlogPosts;
  }
}

export async function listAllBlogPostsFromCms(): Promise<BlogPost[]> {
  if (!hasSanityConfig()) {
    return seedBlogPosts;
  }

  try {
    const client = createSanityClient();
    const records = await fetchBlogPostsFromSanity(client);
    if (!records.length) {
      return seedBlogPosts;
    }
    return mapSanityPostsToBlogPosts(records);
  } catch (error) {
    console.error("[blog] Failed to fetch all posts from Sanity:", error);
    return seedBlogPosts;
  }
}

export async function getBlogPostBySlugFromCms(
  slug: string,
): Promise<BlogPost | null> {
  if (!hasSanityConfig()) {
    return seedBlogPosts.find((post) => post.slug === slug) ?? null;
  }

  try {
    const client = createSanityClient();
    const record = await fetchPublishedBlogPostBySlugFromSanity(client, slug);
    if (!record) {
      return seedBlogPosts.find((post) => post.slug === slug) ?? null;
    }
    return mapSanityPostsToBlogPosts([record])[0];
  } catch (error) {
    console.error(`[blog] Failed to fetch post "${slug}" from Sanity:`, error);
    return seedBlogPosts.find((post) => post.slug === slug) ?? null;
  }
}

export async function getRelatedBlogPostsFromCms(
  currentSlug: string,
  count = 3,
): Promise<BlogPost[]> {
  const posts = await listBlogPostsFromCms();
  return posts.filter((post) => post.slug !== currentSlug).slice(0, count);
}
