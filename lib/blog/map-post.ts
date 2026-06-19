import type { BlogPost } from "@/app/data/blog-types";
import type { SanityBlogPostRecord } from "@/lib/blog/queries";

export function mapSanityPostToBlogPost(record: SanityBlogPostRecord): BlogPost {
  return {
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    date: record.date,
    readTime: record.readTime,
    tag: record.tag,
    coverColor: record.coverColor,
    content: record.content,
    seoTitle: record.seoTitle,
    metaDescription: record.metaDescription,
    focusKeyword: record.focusKeyword,
    canonicalUrl: record.canonicalUrl,
    ogImageUrl: record.ogImageUrl,
    noindex: record.noindex,
    tier: record.tier,
    isPillar: record.isPillar,
    clusterId: record.clusterId,
    clusterTitle: record.clusterTitle,
    lastReviewedAt: record.lastReviewedAt,
    author: record.author,
    medicalReviewer: record.medicalReviewer,
    pillar: record.pillar,
  };
}

export function mapSanityPostsToBlogPosts(
  records: SanityBlogPostRecord[],
): BlogPost[] {
  return records.map(mapSanityPostToBlogPost);
}
