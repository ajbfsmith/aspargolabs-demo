import type { BlogPostsJson, JsonPost } from "./types";

export function validateBlogPostsJson(data: BlogPostsJson): string[] {
  const errors: string[] = [];

  if (!data.config?.startDate) errors.push("config.startDate is required");
  if (!data.config?.publishTime) errors.push("config.publishTime is required");
  if (!data.config?.timezone) errors.push("config.timezone is required");
  if (!data.authors?.length) errors.push("At least one author is required");
  if (!data.posts?.length) errors.push("At least one post is required");

  const authorKeys = new Set<string>();
  for (const author of data.authors ?? []) {
    if (!author.key) errors.push("Each author must have a key");
    if (authorKeys.has(author.key)) {
      errors.push(`Duplicate author key: ${author.key}`);
    }
    authorKeys.add(author.key);
  }

  const reviewerKeys = new Set<string>();
  for (const reviewer of data.medicalReviewers ?? []) {
    if (!reviewer.key) errors.push("Each medical reviewer must have a key");
    if (reviewerKeys.has(reviewer.key)) {
      errors.push(`Duplicate medical reviewer key: ${reviewer.key}`);
    }
    reviewerKeys.add(reviewer.key);
  }

  const slugs = new Set<string>();
  for (const post of data.posts ?? []) {
    errors.push(...validatePost(post, authorKeys, reviewerKeys, slugs));
  }

  const pillarSlugs = new Set(
    data.posts.filter((post) => post.isPillar || post.tier === 1).map((p) => p.slug),
  );
  for (const post of data.posts) {
    if (post.pillarSlug && !pillarSlugs.has(post.pillarSlug) && !slugs.has(post.pillarSlug)) {
      // pillar may be in same batch - check all slugs
      const allSlugs = new Set(data.posts.map((p) => p.slug));
      if (!allSlugs.has(post.pillarSlug)) {
        errors.push(
          `Post "${post.slug}" references unknown pillarSlug "${post.pillarSlug}"`,
        );
      }
    }
  }

  return errors;
}

function validatePost(
  post: JsonPost,
  authorKeys: Set<string>,
  reviewerKeys: Set<string>,
  slugs: Set<string>,
): string[] {
  const errors: string[] = [];

  if (!post.slug) errors.push("Each post must have a slug");
  if (slugs.has(post.slug)) errors.push(`Duplicate slug: ${post.slug}`);
  slugs.add(post.slug);

  if (!post.title) errors.push(`Post "${post.slug}": title is required`);
  if (!post.excerpt) errors.push(`Post "${post.slug}": excerpt is required`);
  if (!post.content) errors.push(`Post "${post.slug}": content is required`);
  if (!post.readTime) errors.push(`Post "${post.slug}": readTime is required`);
  if (!post.tag) errors.push(`Post "${post.slug}": tag is required`);
  if (!post.coverColor) errors.push(`Post "${post.slug}": coverColor is required`);
  if (!post.authorKey) errors.push(`Post "${post.slug}": authorKey is required`);

  if (post.authorKey && !authorKeys.has(post.authorKey)) {
    errors.push(
      `Post "${post.slug}" references unknown authorKey "${post.authorKey}"`,
    );
  }

  if (post.medicalReviewerKey && !reviewerKeys.has(post.medicalReviewerKey)) {
    errors.push(
      `Post "${post.slug}" references unknown medicalReviewerKey "${post.medicalReviewerKey}"`,
    );
  }

  if (post.tier !== undefined && (post.tier < 1 || post.tier > 4)) {
    errors.push(`Post "${post.slug}": tier must be 1-4`);
  }

  return errors;
}
