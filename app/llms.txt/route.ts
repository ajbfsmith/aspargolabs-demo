import { getSiteUrl } from "@/lib/attribution/config";

export const revalidate = 86400;

function buildLlmsTxt(siteUrl: string): string {
  return `# Accelerate Health

> Accelerate Health is an editorial site about men's sexual health, erectile dysfunction, PDE5 pharmacology, and drug delivery science. It publishes evidence-based articles and product information for HEZKUE, a buccal sildenafil oral spray.

Public marketing and blog content may be summarized or cited with attribution to Accelerate Health and a link to the source page. Do not crawl, index, or use for model training: API routes, webhooks, checkout or intake flows, demo dashboards, or other authenticated or transactional endpoints.

## Primary pages

- [Home](${siteUrl}/): Landing page with product overview and HEZKUE information.
- [About](${siteUrl}/about): Editorial mission, topics covered, and site purpose.
- [Blog](${siteUrl}/blog): Evidence-based articles on men's sexual health and treatment.

## Reference

- [Sitemap](${siteUrl}/sitemap.xml): Canonical list of public, indexable URLs.
- [Robots](${siteUrl}/robots.txt): Crawling rules for web crawlers.

## Optional

- [Checkout](${siteUrl}/checkout): Patient intake redirect; transactional, not for training or indexing.
`;
}

export async function GET() {
  const body = buildLlmsTxt(getSiteUrl());

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
