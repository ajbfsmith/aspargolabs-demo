import type { Metadata } from "next";
import type { BlogPost } from "@/app/data/blog-types";
import { getSiteUrl } from "@/lib/attribution/config";

const SITE_NAME = "Accelerate Health";

export function getBlogPostMetadata(post: BlogPost): Metadata {
  const siteUrl = getSiteUrl();
  const title = post.seoTitle ?? `${post.title} | ${SITE_NAME}`;
  const description = post.metaDescription ?? post.excerpt;
  const canonical = post.canonicalUrl ?? `${siteUrl}/blog/${post.slug}`;
  const ogImage = post.ogImageUrl ?? `${siteUrl}/og-default.png`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: post.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.date,
      modifiedTime: post.lastReviewedAt ?? post.date,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildArticleJsonLd(post: BlogPost) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${post.slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    datePublished: post.date,
    dateModified: post.lastReviewedAt ?? post.date,
    url,
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };

  if (post.author) {
    schema.author = {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
      description: post.author.bio,
    };
  }

  if (post.medicalReviewer) {
    schema.reviewedBy = {
      "@type": "Person",
      name: post.medicalReviewer.name,
      jobTitle: post.medicalReviewer.title,
      description: post.medicalReviewer.bio,
    };
  }

  return schema;
}

export function buildBreadcrumbJsonLd(post: BlogPost) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${post.slug}`,
      },
    ],
  };
}

export function buildBlogIndexJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "From the Lab",
    description:
      "Science, product insights, and the future of drug delivery from Accelerate Health.",
    url: `${siteUrl}/blog`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}
