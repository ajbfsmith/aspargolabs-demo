import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { computeSchedule } from "../lib/blog/schedule/compute-dates";
import type { BlogPostsJson, ScheduleConfig } from "../lib/blog/schedule/types";
import { validateBlogPostsJson } from "../lib/blog/schedule/validate";

loadEnv({ path: ".env" });

const DEFAULT_FILE = path.join(process.cwd(), "blogs/blog-posts.json");
const DEFAULT_AUTHORS = path.join(process.cwd(), "blogs/pipeline/authors.json");

function parseArgs(argv: string[]) {
  let file = DEFAULT_FILE;
  let authorsFile = DEFAULT_AUTHORS;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--file") file = path.resolve(argv[++index]);
    else if (arg === "--authors") authorsFile = path.resolve(argv[++index]);
  }

  return { file, authorsFile };
}

function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function mergeScheduleConfig(
  fromAuthors: { config: ScheduleConfig },
  existing: ScheduleConfig,
): ScheduleConfig {
  const today = new Date().toISOString().slice(0, 10);
  return { ...existing, ...fromAuthors.config, startDate: today };
}

function printSummary(scheduled: ReturnType<typeof computeSchedule>) {
  const byPhase = new Map<string, number>();
  for (const post of scheduled) {
    byPhase.set(post.phase, (byPhase.get(post.phase) ?? 0) + 1);
  }

  console.log("\nSchedule summary:");
  for (const [phase, count] of byPhase) {
    console.log(`  ${phase}: ${count} posts`);
  }

  const first = scheduled[0];
  const last = scheduled[scheduled.length - 1];
  if (first && last) {
    console.log(
      `\nFirst publish: ${first.computedPublishedAt} (${first.slug})`,
    );
    console.log(`Last publish:  ${last.computedPublishedAt} (${last.slug})`);
  }
  console.log(`\nTotal: ${scheduled.length} posts\n`);
}

async function main() {
  const { file, authorsFile } = parseArgs(process.argv.slice(2));
  const data = loadJson<BlogPostsJson>(file);
  const authors = loadJson<{ config: ScheduleConfig }>(authorsFile);
  const config = mergeScheduleConfig(authors, data.config);

  const postsForSchedule = data.posts.map((post) => {
    const { publishedAt: _publishedAt, ...rest } = post;
    return rest;
  });

  const errors = validateBlogPostsJson({ ...data, config, posts: postsForSchedule });
  if (errors.length) {
    console.error("[bake-blog-schedule] Validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const scheduled = computeSchedule(postsForSchedule, config);
  const publishedAtBySlug = new Map(
    scheduled.map((post) => [post.slug, post.computedPublishedAt]),
  );

  const baked: BlogPostsJson = {
    ...data,
    config,
    posts: data.posts.map((post) => ({
      ...post,
      publishedAt: publishedAtBySlug.get(post.slug),
    })),
  };

  fs.writeFileSync(file, `${JSON.stringify(baked, null, 2)}\n`, "utf8");
  printSummary(scheduled);
  console.log(`[bake-blog-schedule] Wrote publishedAt for ${scheduled.length} posts to ${file}`);
}

main().catch((error) => {
  console.error("[bake-blog-schedule] Failed:", error);
  process.exit(1);
});
