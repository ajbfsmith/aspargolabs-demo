import type { SanityClient } from "@sanity/client";

const POST_FIELDS = `
  "slug": slug.current,
  title,
  excerpt,
  "date": publishedAt,
  readTime,
  tag,
  coverColor,
  content,
  seoTitle,
  metaDescription,
  focusKeyword,
  canonicalUrl,
  "ogImageUrl": ogImage.asset->url,
  noindex,
  tier,
  isPillar,
  clusterId,
  clusterTitle,
  lastReviewedAt,
  "author": author->{ name, role, bio, credentials },
  "medicalReviewer": medicalReviewer->{ name, title, credentials, bio },
  "pillar": pillar->{ "slug": slug.current, title, focusKeyword }
`;

export const BLOG_POSTS_GROQ = `*[_type == "post"] | order(publishedAt desc) {${POST_FIELDS}}`;

export const BLOG_POSTS_PUBLISHED_GROQ = `*[_type == "post" && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) {${POST_FIELDS}}`;

export const BLOG_POST_BY_SLUG_GROQ = `*[_type == "post" && slug.current == $slug][0] {${POST_FIELDS}}`;

export const BLOG_POST_BY_SLUG_PUBLISHED_GROQ = `*[_type == "post" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0] {${POST_FIELDS}}`;

export const BLOG_CLUSTER_POSTS_GROQ = `*[_type == "post" && pillar._ref == $pillarId && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) {${POST_FIELDS}}`;

export type SanityAuthorRecord = {
  name: string;
  role?: string;
  bio?: string;
  credentials?: string;
};

export type SanityMedicalReviewerRecord = {
  name: string;
  title?: string;
  credentials?: string;
  bio?: string;
};

export type SanityPillarRecord = {
  slug: string;
  title: string;
  focusKeyword?: string;
};

export type SanityBlogPostRecord = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tag: string;
  coverColor: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noindex?: boolean;
  tier?: number;
  isPillar?: boolean;
  clusterId?: string;
  clusterTitle?: string;
  lastReviewedAt?: string;
  author?: SanityAuthorRecord;
  medicalReviewer?: SanityMedicalReviewerRecord;
  pillar?: SanityPillarRecord;
};

export async function fetchBlogPostsFromSanity(
  client: SanityClient,
): Promise<SanityBlogPostRecord[]> {
  return client.fetch<SanityBlogPostRecord[]>(BLOG_POSTS_GROQ);
}

export async function fetchPublishedBlogPostsFromSanity(
  client: SanityClient,
): Promise<SanityBlogPostRecord[]> {
  return client.fetch<SanityBlogPostRecord[]>(BLOG_POSTS_PUBLISHED_GROQ);
}

export async function fetchBlogPostBySlugFromSanity(
  client: SanityClient,
  slug: string,
): Promise<SanityBlogPostRecord | null> {
  return client.fetch<SanityBlogPostRecord | null>(BLOG_POST_BY_SLUG_GROQ, {
    slug,
  });
}

export async function fetchPublishedBlogPostBySlugFromSanity(
  client: SanityClient,
  slug: string,
): Promise<SanityBlogPostRecord | null> {
  return client.fetch<SanityBlogPostRecord | null>(
    BLOG_POST_BY_SLUG_PUBLISHED_GROQ,
    { slug },
  );
}
