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
} from "../lib/blog/sanity-write";
import type { BlogPostsJson, JsonPost } from "../lib/blog/schedule/types";
import { validateBlogPostsJson } from "../lib/blog/schedule/validate";

loadEnv({ path: ".env" });

const DEFAULT_FILE = path.join(process.cwd(), "blogs/blog-posts.json");

function parseArgs(argv: string[]) {
  let file = DEFAULT_FILE;
  let dryRun = !argv.includes("--live");
  let tier: number | undefined;
  let slug: string | undefined;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--live") dryRun = false;
    else if (arg === "--file") file = path.resolve(argv[++index]);
    else if (arg === "--tier") tier = Number(argv[++index]);
    else if (arg === "--slug") slug = argv[++index];
  }

  return { file, dryRun, tier, slug };
}

function loadJson(filePath: string): BlogPostsJson {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as BlogPostsJson;
}

function filterPosts(posts: JsonPost[], tier?: number, slug?: string) {
  let filtered = posts;
  if (tier) filtered = filtered.filter((post) => post.tier === tier);
  if (slug) filtered = filtered.filter((post) => post.slug === slug);
  return filtered;
}

function printPlan(
  posts: JsonPost[],
  authorSlugByKey: Map<string, string>,
  reviewerSlugByKey: Map<string, string>,
) {
  console.log("\nAttribution update plan:\n");
  console.log(["Slug", "Author Key", "Reviewer Key", "Last Reviewed"].join("\t"));
  for (const post of posts) {
    const authorSlug = authorSlugByKey.get(post.authorKey);
    const reviewerSlug = post.medicalReviewerKey
      ? reviewerSlugByKey.get(post.medicalReviewerKey)
      : undefined;
    console.log(
      [
        post.slug,
        `${post.authorKey} -> author-${authorSlug ?? "?"}`,
        post.medicalReviewerKey
          ? `${post.medicalReviewerKey} -> medicalReviewer-${reviewerSlug ?? "?"}`
          : "(none)",
        post.lastReviewedAt ?? "-",
      ].join("\t"),
    );
  }
  console.log(`\nTotal: ${posts.length} posts\n`);
}

async function main() {
  const { file, dryRun, tier, slug } = parseArgs(process.argv.slice(2));
  const data = loadJson(file);
  const errors = validateBlogPostsJson(data);

  if (errors.length) {
    console.error("[sanity:update-attribution] Validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const posts = filterPosts(data.posts, tier, slug);
  const authorSlugByKey = buildAuthorSlugByKey(data.authors);
  const reviewerSlugByKey = buildReviewerSlugByKey(data.medicalReviewers ?? []);

  for (const post of posts) {
    if (!authorSlugByKey.has(post.authorKey)) {
      console.error(
        `[sanity:update-attribution] Unknown authorKey "${post.authorKey}" on post "${post.slug}"`,
      );
      process.exit(1);
    }
    if (post.medicalReviewerKey && !reviewerSlugByKey.has(post.medicalReviewerKey)) {
      console.error(
        `[sanity:update-attribution] Unknown medicalReviewerKey "${post.medicalReviewerKey}" on post "${post.slug}"`,
      );
      process.exit(1);
    }
  }

  printPlan(posts, authorSlugByKey, reviewerSlugByKey);

  if (dryRun) {
    console.log("[sanity:update-attribution] Dry run complete. No documents written.");
    console.log("[sanity:update-attribution] Pass --live to apply attribution updates.");
    return;
  }

  const client = createSanityWriteClient();
  const dataset = getSanityWriteDataset();
  const transaction = client.transaction();

  for (const author of data.authors) {
    transaction.createOrReplace(toAuthorDocument(author));
  }

  for (const reviewer of data.medicalReviewers ?? []) {
    transaction.createOrReplace(toReviewerDocument(reviewer));
  }

  for (const post of posts) {
    const authorSlug = authorSlugByKey.get(post.authorKey)!;
    let patch = client
      .patch(`post-${post.slug}`)
      .set({
        author: { _type: "reference", _ref: `author-${authorSlug}` },
      });

    if (post.medicalReviewerKey) {
      const reviewerSlug = reviewerSlugByKey.get(post.medicalReviewerKey)!;
      patch = patch.set({
        medicalReviewer: {
          _type: "reference",
          _ref: `medicalReviewer-${reviewerSlug}`,
        },
      });
      if (post.lastReviewedAt) {
        patch = patch.set({ lastReviewedAt: post.lastReviewedAt });
      }
    } else {
      patch = patch.unset(["medicalReviewer"]);
    }

    transaction.patch(patch);
  }

  await transaction.commit();
  console.log(
    `[sanity:update-attribution] Upserted ${data.authors.length} authors, ${data.medicalReviewers?.length ?? 0} reviewers, and patched ${posts.length} posts in dataset "${dataset}".`,
  );
  console.log(
    "[sanity:update-attribution] Blog pages read directly from Sanity; restart or wait for ISR revalidation to see changes.",
  );
}

main().catch((error) => {
  console.error("[sanity:update-attribution] Failed:", error);
  process.exit(1);
});
