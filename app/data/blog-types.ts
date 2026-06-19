export interface BlogAuthor {
  name: string;
  role?: string;
  bio?: string;
  credentials?: string;
}

export interface BlogMedicalReviewer {
  name: string;
  title?: string;
  credentials?: string;
  bio?: string;
}

export interface BlogPillarRef {
  slug: string;
  title: string;
  focusKeyword?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tag: string;
  coverColor: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noindex?: boolean;
  tier?: number;
  isPillar?: boolean;
  pillar?: BlogPillarRef;
  clusterId?: string;
  clusterTitle?: string;
  author?: BlogAuthor;
  medicalReviewer?: BlogMedicalReviewer;
  lastReviewedAt?: string;
}
