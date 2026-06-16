import type { SanityClient } from "@sanity/client";

export const BLOG_POSTS_GROQ = `*[_type == "post"] | order(publishedAt desc) {
  "slug": slug.current,
  title,
  excerpt,
  "date": publishedAt,
  readTime,
  tag,
  coverColor,
  content
}`;

export const BLOG_POST_BY_SLUG_GROQ = `*[_type == "post" && slug.current == $slug][0] {
  "slug": slug.current,
  title,
  excerpt,
  "date": publishedAt,
  readTime,
  tag,
  coverColor,
  content
}`;

export type SanityBlogPostRecord = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tag: string;
  coverColor: string;
  content: string;
};

export async function fetchBlogPostsFromSanity(
  client: SanityClient,
): Promise<SanityBlogPostRecord[]> {
  return client.fetch<SanityBlogPostRecord[]>(BLOG_POSTS_GROQ);
}

export async function fetchBlogPostBySlugFromSanity(
  client: SanityClient,
  slug: string,
): Promise<SanityBlogPostRecord | null> {
  return client.fetch<SanityBlogPostRecord | null>(BLOG_POST_BY_SLUG_GROQ, {
    slug,
  });
}
