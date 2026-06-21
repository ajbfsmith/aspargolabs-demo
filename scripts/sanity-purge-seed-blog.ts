import { config as loadEnv } from "dotenv";
import { createSanityWriteClient, getSanityWriteDataset } from "../lib/blog/sanity-write";
import { seedBlogPosts } from "../lib/blog/seed-posts";

loadEnv({ path: ".env" });

/** Legacy demo slugs from `npm run sanity:seed` — not part of the 300-post pipeline. */
const LEGACY_SEED_SLUGS = seedBlogPosts.map((post) => post.slug);

async function main() {
  const client = createSanityWriteClient();
  const dataset = getSanityWriteDataset();
  const dryRun = !process.argv.includes("--live");

  const existing = await client.fetch<{ _id: string; slug: string; title: string }[]>(
    `*[_type == "post" && slug.current in $slugs]{ _id, "slug": slug.current, title }`,
    { slugs: LEGACY_SEED_SLUGS },
  );

  if (!existing.length) {
    console.log(`[sanity:purge-seed] No legacy seed posts found in "${dataset}".`);
    return;
  }

  console.log(`[sanity:purge-seed] Found ${existing.length} legacy seed post(s) in "${dataset}":`);
  for (const doc of existing) {
    console.log(`  - ${doc.slug}  ${doc.title}`);
  }

  if (dryRun) {
    console.log("\n[sanity:purge-seed] Dry run. Pass --live to delete these documents.");
    return;
  }

  const transaction = client.transaction();
  for (const doc of existing) {
    transaction.delete(doc._id);
  }
  await transaction.commit();
  console.log(`[sanity:purge-seed] Deleted ${existing.length} legacy seed post(s).`);
}

main().catch((error) => {
  console.error("[sanity:purge-seed] Failed:", error);
  process.exit(1);
});
