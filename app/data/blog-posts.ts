export type { BlogPost } from "./blog-types";
import { blogPosts } from "./blog-posts.data";

export { blogPosts };

/** True when a post's publishedAt is in the past or present. */
export function isPublished(date: string): boolean {
  return new Date(date) <= new Date();
}

export function getPublishedPosts() {
  return blogPosts.filter((post) => isPublished(post.date));
}

export function getPostBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
  const post = blogPosts.find((entry) => entry.slug === slug);
  if (!post) return undefined;
  if (!options?.includeUnpublished && !isPublished(post.date)) return undefined;
  return post;
}

export function getRelatedPosts(currentSlug: string, count = 3) {
  const current = blogPosts.find((post) => post.slug === currentSlug);
  const published = getPublishedPosts().filter((post) => post.slug !== currentSlug);

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

export function getClusterPostsForPillar(pillarSlug: string) {
  return getPublishedPosts().filter(
    (post) => post.pillar?.slug === pillarSlug && post.slug !== pillarSlug,
  );
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
