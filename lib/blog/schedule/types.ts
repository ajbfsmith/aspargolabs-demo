export type ScheduleConfig = {
  startDate: string;
  publishTime: string;
  timezone: string;
  /** Flat weekly rate when backfillRampPerWeek is omitted. */
  backfillPerWeek: number;
  /** Flat weekly rate when staggerRampPerWeek is omitted. */
  staggerPerWeek: number;
  /** Gradual ramp: posts per week for tier 2–3 backfill (last value repeats). */
  backfillRampPerWeek?: number[];
  /** Gradual ramp: posts per week for tier 4 stagger (last value repeats). */
  staggerRampPerWeek?: number[];
};

export type JsonAuthor = {
  key: string;
  name: string;
  slug: string;
  role?: string;
  bio?: string;
  credentials?: string;
};

export type JsonMedicalReviewer = {
  key: string;
  name: string;
  slug: string;
  title?: string;
  credentials?: string;
  bio?: string;
};

export type JsonPost = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  tag: string;
  coverColor: string;
  content: string;
  publishedAt?: string;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  tier?: number;
  isPillar?: boolean;
  pillarSlug?: string;
  clusterId?: string;
  clusterTitle?: string;
  authorKey: string;
  medicalReviewerKey?: string;
  lastReviewedAt?: string;
};

export type BlogPostsJson = {
  config: ScheduleConfig;
  authors: JsonAuthor[];
  medicalReviewers: JsonMedicalReviewer[];
  posts: JsonPost[];
};

export type ScheduledPost = JsonPost & {
  computedPublishedAt: string;
  phase: string;
};
