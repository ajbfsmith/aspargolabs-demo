import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import {
  buildAuthorSlugByKey,
  buildReviewerSlugByKey,
  createSanityWriteClient,
  getSanityWriteDataset,
  toAuthorDocument,
  toReviewerDocument,
  toSanityDate,
} from "../lib/blog/sanity-write";
import { computeSchedule } from "../lib/blog/schedule/compute-dates";
import type { BlogPostsJson, JsonPost, ScheduledPost, ScheduleConfig } from "../lib/blog/schedule/types";
import { validateBlogPostsJson } from "../lib/blog/schedule/validate";

loadEnv({ path: ".env" });

const DEFAULT_FILE = path.join(process.cwd(), "data/blog-posts.sample.json");

function parseArgs(argv: string[]) {
  let file = DEFAULT_FILE;
  let dryRun = !argv.includes("--live");
  let limit: number | undefined;
  let minimalAttribution = argv.includes("--minimal-attribution");
  let authorKey = "editorial";

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--live") dryRun = false;
    else if (arg === "--minimal-attribution") minimalAttribution = true;
    else if (arg === "--file") file = path.resolve(argv[++index]);
    else if (arg === "--limit") limit = Number(argv[++index]);
    else if (arg === "--author-key") authorKey = argv[++index];
  }

  return { file, dryRun, limit, minimalAttribution, authorKey };
}

function loadJson(filePath: string): BlogPostsJson {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as BlogPostsJson;
}

function applyAttributionMode(
  data: BlogPostsJson,
  minimalAttribution: boolean,
  authorKey: string,
): BlogPostsJson {
  if (!minimalAttribution) return data;

  if (!data.authors.some((author) => author.key === authorKey)) {
    throw new Error(
      `Author key "${authorKey}" was not found in the JSON authors list.`,
    );
  }

  return {
    ...data,
    medicalReviewers: [],
    posts: data.posts.map((post) => ({
      ...post,
      authorKey,
      medicalReviewerKey: undefined,
    })),
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
    publishedAt: toSanityDate(post.computedPublishedAt),
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
    lastReviewedAt: post.lastReviewedAt
      ? toSanityDate(post.lastReviewedAt)
      : undefined,
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

const POST_BATCH_SIZE = 25;

async function commitDocumentsInBatches(
  client: ReturnType<typeof createSanityWriteClient>,
  documents: Array<{ _id: string; _type: string } & Record<string, unknown>>,
  label: string,
) {
  for (let index = 0; index < documents.length; index += POST_BATCH_SIZE) {
    const batch = documents.slice(index, index + POST_BATCH_SIZE);
    const transaction = client.transaction();
    for (const document of batch) {
      transaction.createOrReplace(document);
    }
    await transaction.commit();
    console.log(
      `[sanity:schedule] Wrote ${Math.min(index + batch.length, documents.length)}/${documents.length} ${label}`,
    );
  }
}

function resolveScheduledPosts(
  posts: JsonPost[],
  config: ScheduleConfig,
): ScheduledPost[] {
  const allBaked = posts.length > 0 && posts.every((post) => post.publishedAt);
  if (allBaked) {
    return posts
      .map((post) => ({
        ...post,
        computedPublishedAt: toSanityDate(post.publishedAt!),
        phase: "baked",
      }))
      .sort((a, b) =>
        a.computedPublishedAt.localeCompare(b.computedPublishedAt),
      );
  }

  return computeSchedule(posts, config);
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
  const { file, dryRun, limit, minimalAttribution, authorKey } = parseArgs(
    process.argv.slice(2),
  );
  const loaded = loadJson(file);
  const data = applyAttributionMode(loaded, minimalAttribution, authorKey);
  const errors = validateBlogPostsJson(data);

  if (errors.length) {
    console.error("[sanity:schedule] Validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  let scheduled = resolveScheduledPosts(data.posts, data.config);
  if (limit && limit > 0) {
    scheduled = scheduled.slice(0, limit);
  }

  printScheduleTable(scheduled);

  if (dryRun) {
    console.log("[sanity:schedule] Dry run complete. No documents written.");
    if (minimalAttribution) {
      console.log(
        "[sanity:schedule] Minimal attribution: posts use editorial author only; no medical reviewers.",
      );
    }
    console.log("[sanity:schedule] Pass --live to write to Sanity.");
    return;
  }

  const client = createSanityWriteClient();
  const dataset = getSanityWriteDataset();

  const authorSlugByKey = buildAuthorSlugByKey(data.authors);
  const reviewerSlugByKey = buildReviewerSlugByKey(data.medicalReviewers ?? []);

  const people = [
    ...data.authors.map(toAuthorDocument),
    ...(data.medicalReviewers ?? []).map(toReviewerDocument),
  ];
  if (people.length) {
    await commitDocumentsInBatches(client, people, "authors/reviewers");
  }

  const postDocuments = scheduled.map((post) =>
    toPostDocument(post, authorSlugByKey, reviewerSlugByKey),
  );
  await commitDocumentsInBatches(client, postDocuments, "posts");

  console.log(
    `[sanity:schedule] Upserted ${data.authors.length} authors, ${data.medicalReviewers?.length ?? 0} reviewers, and ${scheduled.length} posts to dataset "${dataset}".`,
  );
  if (minimalAttribution) {
    console.log(
      "[sanity:schedule] Attribution was deferred. Run `npm run sanity:update-attribution` after clinician details are confirmed.",
    );
  }
  console.log(
    "[sanity:schedule] Blog pages read directly from Sanity; restart or wait for ISR revalidation to see changes.",
  );
}

main().catch((error) => {
  console.error("[sanity:schedule] Failed:", error);
  process.exit(1);
});
