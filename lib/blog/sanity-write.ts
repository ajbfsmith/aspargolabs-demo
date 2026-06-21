import { createClient } from "@sanity/client";
import type { JsonAuthor, JsonMedicalReviewer } from "./schedule/types";

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSanityWriteDataset(): string {
  return process.env.SANITY_DATASET?.trim() || "production";
}

/** Sanity `date` fields expect YYYY-MM-DD (no time component). */
export function toSanityDate(value: string): string {
  return value.slice(0, 10);
}

export function todaySanityDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createSanityWriteClient() {
  return createClient({
    projectId: requireEnv("SANITY_PROJECT_ID"),
    dataset: getSanityWriteDataset(),
    apiVersion: process.env.SANITY_API_VERSION?.trim() || "2024-01-01",
    token: requireEnv("SANITY_API_WRITE_TOKEN"),
    useCdn: false,
  });
}

export function toAuthorDocument(author: JsonAuthor) {
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

export function toReviewerDocument(reviewer: JsonMedicalReviewer) {
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

export function buildAuthorSlugByKey(authors: JsonAuthor[]) {
  return new Map(authors.map((author) => [author.key, author.slug]));
}

export function buildReviewerSlugByKey(reviewers: JsonMedicalReviewer[] = []) {
  return new Map(reviewers.map((reviewer) => [reviewer.key, reviewer.slug]));
}
