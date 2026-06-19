import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { computeSchedule } from "../lib/blog/schedule/compute-dates";
import type { BlogPostsJson, JsonAuthor, JsonMedicalReviewer, ScheduledPost } from "../lib/blog/schedule/types";
import { validateBlogPostsJson } from "../lib/blog/schedule/validate";

loadEnv({ path: ".env" });

const DEFAULT_FILE = path.join(process.cwd(), "data/blog-posts.sample.json");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseArgs(argv: string[]) {
  let file = DEFAULT_FILE;
  let dryRun = !argv.includes("--live");
  let limit: number | undefined;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--live") dryRun = false;
    else if (arg === "--file") file = path.resolve(argv[++index]);
    else if (arg === "--limit") limit = Number(argv[++index]);
  }

  return { file, dryRun, limit };
}

function createWriteClient() {
  return createClient({
    projectId: requireEnv("SANITY_PROJECT_ID"),
    dataset: process.env.SANITY_DATASET?.trim() || "production",
    apiVersion: process.env.SANITY_API_VERSION?.trim() || "2024-01-01",
    token: requireEnv("SANITY_API_WRITE_TOKEN"),
    useCdn: false,
  });
}

function loadJson(filePath: string): BlogPostsJson {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as BlogPostsJson;
}

function toAuthorDocument(author: JsonAuthor) {
  return {
    _id: `author-${author.slug}`,
    _type: "author" as const,
    name: author.name,
    slug: { _type: "slug" as const, current: author.slug },
    role: author.role,
    bio: author.bio,
    credentials: author.credentials,
  };
}

function toReviewerDocument(reviewer: JsonMedicalReviewer) {
  return {
    _id: `medicalReviewer-${reviewer.slug}`,
    _type: "medicalReviewer" as const,
    name: reviewer.name,
    slug: { _type: "slug" as const, current: reviewer.slug },
    title: reviewer.title,
    credentials: reviewer.credentials,
    bio: reviewer.bio,
  };
}

function toPostDocument(
  post: ScheduledPost,
  authorSlugByKey: Map<string, string>,
  reviewerSlugByKey: Map<string, string>,
) {
  const authorSlug = authorSlugByKey.get(post.authorKey);
  if (!authorSlug) {
    throw new Error(`Missing author slug for key "${post.authorKey}"`);
  }

  const doc = {
    _id: `post-${post.slug}`,
    _type: "post" as const,
    title: post.title,
    slug: { _type: "slug" as const, current: post.slug },
    excerpt: post.excerpt,
    publishedAt: post.computedPublishedAt,
    readTime: post.readTime,
    tag: post.tag,
    coverColor: post.coverColor,
    content: post.content.trim(),
    author: { _type: "reference" as const, _ref: `author-${authorSlug}` },
    seoTitle: post.seoTitle,
    metaDescription: post.metaDescription,
    focusKeyword: post.focusKeyword,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
    tier: post.tier,
    isPillar: post.isPillar,
    clusterId: post.clusterId,
    clusterTitle: post.clusterTitle,
    lastReviewedAt: post.lastReviewedAt,
    medicalReviewer: post.medicalReviewerKey
      ? {
          _type: "reference" as const,
          _ref: `medicalReviewer-${reviewerSlugByKey.get(post.medicalReviewerKey)}`,
        }
      : undefined,
    pillar: post.pillarSlug
      ? { _type: "reference" as const, _ref: `post-${post.pillarSlug}` }
      : undefined,
  };

  if (post.medicalReviewerKey && !reviewerSlugByKey.get(post.medicalReviewerKey)) {
    throw new Error(
      `Missing medical reviewer slug for key "${post.medicalReviewerKey}"`,
    );
  }

  return doc;
}

function printScheduleTable(posts: ScheduledPost[]) {
  console.log("\nComputed schedule:\n");
  console.log(
    ["Phase", "Published At (UTC)", "Tier", "Slug", "Title"].join("\t"),
  );
  for (const post of posts) {
    console.log(
      [
        post.phase,
        post.computedPublishedAt,
        post.tier ?? "-",
        post.slug,
        post.title.slice(0, 60),
      ].join("\t"),
    );
  }
  console.log(`\nTotal: ${posts.length} posts\n`);
}

async function main() {
  const { file, dryRun, limit } = parseArgs(process.argv.slice(2));
  const data = loadJson(file);
  const errors = validateBlogPostsJson(data);

  if (errors.length) {
    console.error("[sanity:schedule] Validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  let scheduled = computeSchedule(data.posts, data.config);
  if (limit && limit > 0) {
    scheduled = scheduled.slice(0, limit);
  }

  printScheduleTable(scheduled);

  if (dryRun) {
    console.log("[sanity:schedule] Dry run complete. No documents written.");
    console.log("[sanity:schedule] Pass --live to write to Sanity.");
    return;
  }

  const client = createWriteClient();
  const transaction = client.transaction();

  const authorSlugByKey = new Map(
    data.authors.map((author) => [author.key, author.slug]),
  );
  const reviewerSlugByKey = new Map(
    (data.medicalReviewers ?? []).map((reviewer) => [
      reviewer.key,
      reviewer.slug,
    ]),
  );

  for (const author of data.authors) {
    transaction.createOrReplace(toAuthorDocument(author));
  }

  for (const reviewer of data.medicalReviewers ?? []) {
    transaction.createOrReplace(toReviewerDocument(reviewer));
  }

  for (const post of scheduled) {
    transaction.createOrReplace(
      toPostDocument(post, authorSlugByKey, reviewerSlugByKey),
    );
  }

  await transaction.commit();
  console.log(
    `[sanity:schedule] Upserted ${data.authors.length} authors, ${data.medicalReviewers?.length ?? 0} reviewers, and ${scheduled.length} posts.`,
  );
  console.log("[sanity:schedule] Run `npm run sanity:sync` to refresh static blog data.");
}

main().catch((error) => {
  console.error("[sanity:schedule] Failed:", error);
  process.exit(1);
});
