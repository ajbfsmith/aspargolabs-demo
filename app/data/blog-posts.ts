export type { BlogPost } from "./blog-types";
import { blogPosts } from "./blog-posts.data";

export { blogPosts };

export function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(currentSlug: string, count = 3) {
  return blogPosts
    .filter((post) => post.slug !== currentSlug)
    .slice(0, count);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
