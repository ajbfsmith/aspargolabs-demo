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
  };
}

export function mapSanityPostsToBlogPosts(
  records: SanityBlogPostRecord[],
): BlogPost[] {
  return records.map(mapSanityPostToBlogPost);
}
