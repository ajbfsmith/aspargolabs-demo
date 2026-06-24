# Blog Scheduling & SEO Operations Guide

This guide covers how to schedule 300 blog posts in Sanity on the **free tier**, reveal them over time on the Accelerate Health site, and maximize SEO.

---

## How scheduling works (free tier)

Sanity's paid Scheduled Publishing is **not required**. Instead:

1. The `sanity:schedule` script **publishes all posts immediately** to Sanity with a **future `publishedAt` datetime**.
2. The frontend **hides posts** whose `publishedAt` is still in the future.
3. Posts appear automatically when their scheduled time passes — no Sanity plan upgrade needed.

```text
JSON file → sanity:schedule → Sanity (all posts, future publishedAt)
                                    ↓
                            sanity:sync → blog-posts.data.ts
                                    ↓
              /blog (client filter)     /blog/[slug] (ISR + 404 if future)
```

### Reveal mechanics

| Surface | Behavior |
|---------|----------|
| `/blog` index | Client-side `publishedAt <= now` filter — posts appear instantly at scheduled time |
| `/blog/[slug]` | `revalidate = 300` (5 min ISR); returns 404 for future posts until regenerated |
| `/sitemap.xml` | Only includes published posts |
| `/api/blog` | GROQ filter `publishedAt <= now()` |

### On-demand revalidation (recommended)

Blog pages and the sitemap use ISR (`revalidate = 300`). They only refresh when something requests those URLs after the cache goes stale. Scheduled posts go live on a clock — Sanity does **not** fire a webhook when `publishedAt` elapses.

Use the built-in revalidation endpoint to force-refresh `/sitemap.xml`, `/blog`, and all `/blog/[slug]` pages without a full Vercel redeploy.

**1. Set the secret** (local `.env` and Vercel → Environment Variables):

```bash
openssl rand -hex 32
```

```env
REVALIDATE_SECRET="paste-generated-secret-here"
```

**2. Deploy**, then verify:

```bash
curl "https://www.acceleratehealth.co/api/revalidate"
# → { "ok": true, "configured": true, ... }

curl -X POST "https://www.acceleratehealth.co/api/revalidate?secret=YOUR_SECRET"
# → { "ok": true, "revalidated": ["/sitemap.xml", "/blog", "/blog/[slug]"], ... }
```

**3. Cron every 15–30 minutes** ([cron-job.org](https://cron-job.org) is free):

| Field | Value |
|-------|-------|
| URL | `https://www.acceleratehealth.co/api/revalidate?secret=YOUR_SECRET` |
| Method | `POST` |
| Schedule | Every 15 or 30 minutes |

This catches scheduled posts when their `publishedAt` time passes.

**4. Optional — Sanity webhook** for instant refresh when you edit or import posts in Studio:

- Sanity → Project → API → Webhooks → Create
- URL: `https://www.acceleratehealth.co/api/revalidate?secret=YOUR_SECRET`
- Method: `POST`
- Trigger: Document `post` — Create, Update, Delete
- Debounce if you bulk-import (or run one manual revalidate after a batch)

Bearer auth also works: `Authorization: Bearer YOUR_SECRET` (no `?secret=` in the URL).

---

## Prerequisites

### Sanity (free tier)

- Sanity project with `SANITY_PROJECT_ID` and `SANITY_DATASET` configured
- Write token with create/update permissions: `SANITY_API_WRITE_TOKEN`
- Studio deployed: `npm run sanity:deploy`

### Environment variables

Copy from `.env.example`:

```env
SANITY_PROJECT_ID="your-sanity-project-id"
SANITY_DATASET="production"
SANITY_API_VERSION="2024-01-01"
SANITY_API_WRITE_TOKEN="your-sanity-write-token"
NEXT_PUBLIC_SITE_URL="https://acceleratehealth.co"
REVALIDATE_SECRET="your-revalidate-secret"  # for /api/revalidate cron + optional Sanity webhook
```

Set `NEXT_PUBLIC_SITE_URL` to your production domain before launch. This drives canonical URLs, Open Graph, sitemap, and JSON-LD.

---

## JSON file structure

Create your full 300-post file following `data/blog-posts.sample.json`:

```json
{
  "config": {
    "startDate": "2026-07-07",
    "publishTime": "09:00",
    "timezone": "America/New_York",
    "backfillPerWeek": 35,
    "staggerPerWeek": 4
  },
  "authors": [ ... ],
  "medicalReviewers": [ ... ],
  "posts": [ ... ]
}
```

### `config` fields

| Field | Description |
|-------|-------------|
| `startDate` | Rollout anchor date (`YYYY-MM-DD`). Week 1 pillar posts publish this week. **Must not be in the past.** |
| `publishTime` | Local time of day for each publish slot (`HH:mm`, 24h) |
| `timezone` | IANA timezone (e.g. `America/New_York`) |
| `backfillPerWeek` | Posts per week during Weeks 2–6 (Tier 2–3 backfill). Default: 35 |
| `staggerPerWeek` | Posts per week during Months 2–7 (Tier 4). Default: 4 |

### Author / reviewer objects

```json
{
  "key": "clinical",
  "name": "Dr. James Rothwell",
  "slug": "dr-james-rothwell",
  "role": "Medical Writer",
  "bio": "...",
  "credentials": "MD, MPH"
}
```

Keys are referenced from posts via `authorKey` and `medicalReviewerKey`.

### Post object (required fields)

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | Yes | URL slug, unique |
| `title` | Yes | |
| `excerpt` | Yes | Used as meta description fallback |
| `readTime` | Yes | e.g. `"6 min read"` |
| `tag` | Yes | Display category |
| `coverColor` | Yes | Tailwind gradient classes |
| `content` | Yes | Markdown (##, ###, -, >, **bold**) |
| `authorKey` | Yes | Must match an author `key` |
| `tier` | Recommended | 1–4 (see rollout phases) |
| `isPillar` | For pillars | `true` for cornerstone pages |
| `pillarSlug` | For cluster posts | Slug of the parent pillar |
| `clusterId` / `clusterTitle` | Recommended | Group identifier and display name |
| `medicalReviewerKey` | Tier 1 recommended | Required for YMYL pillar content |
| `publishedAt` | Optional | Explicit ISO datetime; overrides auto-schedule |
| `seoTitle` | Recommended | Overrides `<title>` tag |
| `metaDescription` | Recommended | 150–160 chars |
| `focusKeyword` | Recommended | Used in pillar link anchor text |
| `canonicalUrl` | Optional | Override canonical (default: site + slug) |
| `noindex` | Optional | `true` to exclude from indexing |

---

## Rollout calendar

Map your 300 posts from `docs/blogs-ideas.md` before running the script:

| Phase | When | Posts | Criteria |
|-------|------|-------|----------|
| Week 0 | Before any publish | — | Map all posts into 8–12 topic clusters; write pillar pages |
| Week 1 | `startDate` week | ~20 Tier 1 pillars | `tier: 1` or `isPillar: true` |
| Weeks 2–6 | +1 to +5 weeks | ~200 backfill | Tier 2 + Tier 3 (`backfillPerWeek` per week) |
| Months 2–7 | +6 weeks onward | ~100 stagger | Tier 4 (`staggerPerWeek` per week) |

**Rules:**
- Use **actual publication dates** — never backdate.
- Every cluster post must have `pillarSlug` pointing to its pillar.
- Pillar pages must link to cluster posts (handled automatically on the frontend via `isPillar` + cluster references).
- Tier 1 pillars require `medicalReviewerKey`.

---

## Running the script

### 1. Dry run (safe — no writes)

```bash
npm run sanity:schedule -- --dry-run
```

Prints the computed schedule table. Use this to verify dates, phases, and slug assignments.

### 2. Dry run with a custom file

```bash
npm run sanity:schedule -- --dry-run --file data/blog-posts.json
```

### 3. Limit posts (testing)

```bash
npm run sanity:schedule -- --dry-run --limit 3
```

### 4. Live import

```bash
npm run sanity:schedule -- --live --file data/blog-posts.json
```

Requires `SANITY_API_WRITE_TOKEN` in `.env`. **Omit `--live` to dry-run by default** (no writes).

### 5. Sync to static site data

After importing (or when adding new content):

```bash
npm run sanity:sync
```

This writes `app/data/blog-posts.data.ts` with **all** posts including future-dated ones. The frontend date filter handles reveal.

---

## Manual SEO checklist

### One-time setup

- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Deploy site with `sitemap.ts` and `robots.ts` active
- [ ] Create [Google Search Console](https://search.google.com/search-console) property
- [ ] Create [Bing Webmaster Tools](https://www.bing.com/webmasters) property
- [ ] Submit sitemap: `https://yourdomain.com/sitemap.xml`
- [ ] Verify `robots.txt` references sitemap: `https://yourdomain.com/robots.txt`
- [ ] Set `REVALIDATE_SECRET` and configure a 15–30 min cron hitting `/api/revalidate`

### Per-post checklist (all 300 posts)

- [ ] Unique `slug` (no duplicates)
- [ ] `seoTitle` under 60 characters, includes focus keyword
- [ ] `metaDescription` 150–160 characters, includes keyword naturally
- [ ] `focusKeyword` set and used in H2s and first paragraph
- [ ] `excerpt` compelling and distinct from meta description
- [ ] Internal link to pillar page (`pillarSlug`) for cluster posts
- [ ] 2–3 internal links to related posts in `content` markdown
- [ ] `authorKey` set; Tier 1 has `medicalReviewerKey`
- [ ] Alt text on images when `ogImage` is added in Studio
- [ ] No keyword stuffing
- [ ] Medical disclaimer on YMYL content ("talk to your doctor")
- [ ] Human editorial pass on all AI-drafted content

### Content quality (non-negotiable)

- Tier 1 (pillars): human-written or heavily edited, named medical reviewer
- Tier 2: AI first draft → human editorial review
- Tier 3: AI draft → light edit
- Tier 4: AI draft → editor → compliance check
- Every post needs original perspective, real examples, and cited sources where applicable

### Ongoing monitoring (weekly)

- [ ] Google Search Console → Coverage: check for crawl errors
- [ ] GSC → Performance: identify top-performing clusters
- [ ] Update underperforming posts (refresh `lastReviewedAt` in Sanity)
- [ ] Build backlinks to top-performing pillar pages
- [ ] Check Core Web Vitals in GSC
- [ ] Verify new posts appear on `/blog` after their `publishedAt` time

---

## Topic cluster architecture

Before importing, group posts into clusters:

```text
Cluster: ed-guide
  Pillar: complete-guide-erectile-dysfunction (tier 1, isPillar)
  ├── ed-causes-by-age-... (tier 2, pillarSlug: complete-guide-...)
  ├── psychological-erectile-dysfunction-guide (tier 2)
  └── erectile-dysfunction-diabetes (tier 2)

Cluster: delivery-science
  Pillar: spray-suspension-technology-overview (tier 1, isPillar)
  ├── oral-spray-vs-tablets-pharmacokinetics (tier 2)
  └── does-food-affect-sildenafil-absorption (tier 3)
```

Every cluster post gets:
- `pillarSlug` → parent pillar slug
- `clusterId` + `clusterTitle` → grouping metadata

Pillar pages automatically render an "In this guide" section listing their cluster posts.

---

## Technical SEO (implemented in codebase)

| Feature | Location |
|---------|----------|
| XML sitemap (published posts only) | `app/sitemap.ts` |
| robots.txt | `app/robots.ts` |
| `metadataBase` | `app/layout.tsx` |
| Per-post metadata (title, description, canonical, OG, Twitter) | `app/blog/[slug]/page.tsx` |
| JSON-LD Article/MedicalWebPage + BreadcrumbList | `lib/blog/seo.ts` |
| Blog index metadata + Blog JSON-LD | `app/blog/page.tsx` |
| Author bio + medical reviewer block | `app/blog/[slug]/page.tsx` |
| Pillar ↔ cluster internal links | `app/blog/[slug]/page.tsx` |
| Date gating helpers | `app/data/blog-posts.ts` |
| Published-only API queries | `lib/blog/queries.ts` |

---

## Troubleshooting

### "would be backdated" error

`config.startDate` is before today. Set it to today or a future date.

### Post not appearing on /blog after scheduled time

- Confirm `publishedAt` is in the past (check Sanity Studio)
- Hard-refresh the browser (client-side filter)
- For detail page: wait up to 5 minutes for ISR, or call `/api/revalidate`

### Post returns 404 on detail page but shows on index

ISR cache may be stale. Call `/api/revalidate` or wait for the `revalidate = 300` cycle.

### sanity:sync fails

- Verify `SANITY_PROJECT_ID` is set
- Run `sanity:schedule` or `sanity:seed` first to populate posts
- Check token permissions

---

## Quick reference

```bash
# Validate schedule (no writes)
npm run sanity:schedule -- --dry-run

# Import posts to Sanity
npm run sanity:schedule -- --live --file data/blog-posts.json

# Pull Sanity → static data
npm run sanity:sync

# Deploy Studio
npm run sanity:deploy

# Deploy site
npm run build
```
