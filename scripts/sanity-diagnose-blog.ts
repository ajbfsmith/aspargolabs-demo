import { config as loadEnv } from "dotenv";
import { createSanityClient } from "../lib/sanity/client";
import { getSanityEnv } from "../lib/sanity/env";
import {
  fetchPublishedBlogPostsFromSanity,
} from "../lib/blog/queries";

loadEnv({ path: ".env" });

async function main() {
  const env = getSanityEnv();
  console.log("Sanity config:", {
    projectId: env.projectId,
    dataset: env.dataset,
    useCdn: env.useCdn,
    hasToken: Boolean(env.token),
  });

  const client = createSanityClient();
  const psychology = await client.fetch(
    `*[_type == "post" && title match "On-Demand Confidence*"]{ "slug": slug.current, publishedAt, title }`,
  );
  if (psychology.length) {
    console.log("\nMatching 'On-Demand Confidence' posts:", psychology);
  }

  const published = await fetchPublishedBlogPostsFromSanity(client);
  console.log(`\nPublished posts (publishedAt <= now()): ${published.length}`);
  for (const post of published.slice(0, 8)) {
    console.log(`  - ${post.date}  ${post.slug}  ${post.title.slice(0, 50)}`);
  }

  const all = await client.fetch<{ slug: string; publishedAt?: string; title: string }[]>(
    `*[_type == "post"] | order(publishedAt desc) { "slug": slug.current, publishedAt, title }`,
  );
  console.log(`\nAll posts in dataset: ${all.length}`);

  const seedSlugs = [
    "the-psychology-of-on-demand",
    "oral-spray-vs-tablets-pharmacokinetics",
  ];
  for (const slug of seedSlugs) {
    const hit = all.find((p) => p.slug === slug);
    if (hit) {
      console.log(`  [seed leftover] ${slug} -> publishedAt ${hit.publishedAt}`);
    }
  }

  const now = new Date().toISOString();
  console.log(`\nServer now (UTC): ${now}`);
  const future = all.filter((p) => p.publishedAt && p.publishedAt > now).length;
  const past = all.filter((p) => p.publishedAt && p.publishedAt <= now).length;
  console.log(`Past/future split: ${past} published, ${future} scheduled`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
