import { config as loadEnv } from "dotenv";
import {
  createSanityWriteClient,
  getSanityWriteDataset,
  toSanityDate,
} from "../lib/blog/sanity-write";
import { seedBlogPosts } from "../lib/blog/seed-posts";

loadEnv({ path: ".env" });

const DEFAULT_AUTHOR = {
  _id: "author-accelerate-health-editorial",
  _type: "author" as const,
  name: "Accelerate Health Editorial",
  slug: { _type: "slug" as const, current: "accelerate-health-editorial" },
  role: "Editorial Team",
  bio: "The Accelerate Health editorial team covers pharmaceutical science, sexual health, and drug delivery innovation.",
  credentials: "MS, Science Communication",
};

function toSanityDocument(post: (typeof seedBlogPosts)[number]) {
  return {
    _id: `post-${post.slug}`,
    _type: "post" as const,
    title: post.title,
    slug: { _type: "slug" as const, current: post.slug },
    excerpt: post.excerpt,
    publishedAt: toSanityDate(post.date),
    readTime: post.readTime,
    tag: post.tag,
    coverColor: post.coverColor,
    content: post.content.trim(),
    author: { _type: "reference" as const, _ref: DEFAULT_AUTHOR._id },
  };
}

async function main() {
  const client = createSanityWriteClient();
  const dataset = getSanityWriteDataset();
  const transaction = client.transaction();

  transaction.createOrReplace(DEFAULT_AUTHOR);

  for (const post of seedBlogPosts) {
    transaction.createOrReplace(toSanityDocument(post));
  }

  await transaction.commit();
  console.log(
    `[sanity:seed] Seeded ${seedBlogPosts.length} blog posts to dataset "${dataset}".`,
  );
}

main().catch((error) => {
  console.error("[sanity:seed] Failed:", error);
  process.exit(1);
});
