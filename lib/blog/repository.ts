import "server-only";

import type { BlogPost } from "@/app/data/blog-types";
import { mapSanityPostsToBlogPosts } from "@/lib/blog/map-post";
import {
  fetchPublishedBlogPostBySlugFromSanity,
  fetchPublishedBlogPostsFromSanity,
} from "@/lib/blog/queries";
import { createSanityClient } from "@/lib/sanity/client";
import { hasSanityConfig } from "@/lib/sanity/env";

function pickRelatedPosts(
  posts: BlogPost[],
  currentSlug: string,
  count: number,
): BlogPost[] {
  const current = posts.find((post) => post.slug === currentSlug);
  const published = posts.filter((post) => post.slug !== currentSlug);

  if (current?.pillar?.slug) {
    const clusterPeers = published.filter(
      (post) =>
        post.pillar?.slug === current.pillar?.slug ||
        post.slug === current.pillar?.slug,
    );
    if (clusterPeers.length >= count) {
      return clusterPeers.slice(0, count);
    }
  }

  if (current?.clusterId) {
    const clusterPeers = published.filter(
      (post) => post.clusterId === current.clusterId,
    );
    if (clusterPeers.length >= count) {
      return clusterPeers.slice(0, count);
    }
  }

  return published.slice(0, count);
}

export async function listBlogPostsFromCms(): Promise<BlogPost[]> {
  if (!hasSanityConfig()) {
    console.warn("[blog] SANITY_PROJECT_ID is not set; returning no posts.");
    return [];
  }

  try {
    const client = createSanityClient();
    const records = await fetchPublishedBlogPostsFromSanity(client);
    return mapSanityPostsToBlogPosts(records);
  } catch (error) {
    console.error("[blog] Failed to fetch posts from Sanity:", error);
    return [];
  }
}

export async function getBlogPostBySlugFromCms(
  slug: string,
): Promise<BlogPost | null> {
  if (!hasSanityConfig()) {
    console.warn("[blog] SANITY_PROJECT_ID is not set; cannot load post.");
    return null;
  }

  try {
    const client = createSanityClient();
    const record = await fetchPublishedBlogPostBySlugFromSanity(client, slug);
    if (!record) return null;
    return mapSanityPostsToBlogPosts([record])[0];
  } catch (error) {
    console.error(`[blog] Failed to fetch post "${slug}" from Sanity:`, error);
    return null;
  }
}

export async function getRelatedBlogPostsFromCms(
  currentSlug: string,
  count = 3,
): Promise<BlogPost[]> {
  const posts = await listBlogPostsFromCms();
  return pickRelatedPosts(posts, currentSlug, count);
}

export async function getClusterPostsForPillarFromCms(
  pillarSlug: string,
): Promise<BlogPost[]> {
  const posts = await listBlogPostsFromCms();
  return posts.filter(
    (post) => post.pillar?.slug === pillarSlug && post.slug !== pillarSlug,
  );
}
