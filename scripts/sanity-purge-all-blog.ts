import { config as loadEnv } from "dotenv";
import { createSanityWriteClient, getSanityWriteDataset } from "../lib/blog/sanity-write";

loadEnv({ path: ".env" });

const BATCH_SIZE = 100;

function parseArgs(argv: string[]) {
  return {
    dryRun: !argv.includes("--live"),
    includeAuthors: argv.includes("--include-authors"),
  };
}

async function patchInBatches(
  client: ReturnType<typeof createSanityWriteClient>,
  ids: string[],
  label: string,
) {
  for (let index = 0; index < ids.length; index += BATCH_SIZE) {
    const batch = ids.slice(index, index + BATCH_SIZE);
    const transaction = client.transaction();
    for (const id of batch) {
      transaction.patch(id, (patch) =>
        patch.unset(["pillar", "medicalReviewer", "author"]),
      );
    }
    await transaction.commit();
    console.log(
      `[sanity:purge-all] Cleared refs on ${Math.min(index + batch.length, ids.length)}/${ids.length} ${label}`,
    );
  }
}

async function deleteInBatches(
  client: ReturnType<typeof createSanityWriteClient>,
  ids: string[],
  label: string,
) {
  for (let index = 0; index < ids.length; index += BATCH_SIZE) {
    const batch = ids.slice(index, index + BATCH_SIZE);
    const transaction = client.transaction();
    for (const id of batch) {
      transaction.delete(id);
    }
    await transaction.commit();
    console.log(
      `[sanity:purge-all] Deleted ${Math.min(index + batch.length, ids.length)}/${ids.length} ${label}`,
    );
  }
}

async function main() {
  const { dryRun, includeAuthors } = parseArgs(process.argv.slice(2));
  const client = createSanityWriteClient();
  const dataset = getSanityWriteDataset();

  const posts = await client.fetch<{ _id: string; slug: string; title: string }[]>(
    `*[_type == "post"]{ _id, "slug": slug.current, title }`,
  );

  console.log(`[sanity:purge-all] Dataset: "${dataset}"`);
  console.log(`[sanity:purge-all] Found ${posts.length} post(s).`);

  if (includeAuthors) {
    const authors = await client.fetch<{ _id: string; name: string }[]>(
      `*[_type in ["author", "medicalReviewer"]]{ _id, name }`,
    );
    console.log(`[sanity:purge-all] Found ${authors.length} author/reviewer doc(s).`);
  }

  if (!posts.length && !includeAuthors) {
    console.log("[sanity:purge-all] Nothing to delete.");
    return;
  }

  if (dryRun) {
    for (const post of posts.slice(0, 10)) {
      console.log(`  - ${post.slug}  ${post.title.slice(0, 60)}`);
    }
    if (posts.length > 10) {
      console.log(`  ... and ${posts.length - 10} more`);
    }
    console.log("\n[sanity:purge-all] Dry run. Pass --live to delete.");
    return;
  }

  if (dataset === "production") {
    console.log("[sanity:purge-all] WARNING: deleting from production.");
  }

  const postIds = posts.map((post) => post._id);
  await patchInBatches(client, postIds, "posts");

  await deleteInBatches(client, postIds, "posts");

  if (includeAuthors) {
    const authors = await client.fetch<{ _id: string }[]>(
      `*[_type in ["author", "medicalReviewer"]]{ _id }`,
    );
    if (authors.length) {
      await deleteInBatches(
        client,
        authors.map((doc) => doc._id),
        "authors/reviewers",
      );
    }
  }

  console.log(`[sanity:purge-all] Done. Removed ${posts.length} post(s) from "${dataset}".`);
}

main().catch((error) => {
  console.error("[sanity:purge-all] Failed:", error);
  process.exit(1);
});
