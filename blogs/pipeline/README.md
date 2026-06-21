# Accelerate Health Blog Drafter Pipeline

This pipeline turns `Ideas.md` into grounded, reviewed Markdown drafts, then
builds `blog-posts.json` for the existing Sanity scheduler in
`../aspargolabs-demo`.

The workflow is intentionally two-stage:

1. Gemini writes article Markdown only.
2. Humans review the Markdown.
3. The assembler deterministically fills the JSON schema.

## Setup

```bash
cd accelerate-health-posts
python -m venv .venv
.venv\Scripts\activate
pip install -r pipeline\requirements.txt
copy pipeline\.env.example pipeline\.env
```

Set `GEMINI_API_KEY` in `pipeline\.env`.

## Week 0: Build The Architecture

Regenerate the idea inventory any time `Ideas.md` changes:

```bash
python pipeline\parse_ideas.py
```

Review these files before drafting at scale:

- `pipeline\clusters.json` maps Cluster A-O to pillar pages, tags, colors,
  authors, and reviewers.
- `pipeline\ideas.json` is the generated brief inventory. It should contain
  300 ideas.
- `pipeline\prompts\system_prompt.md` defines the writing rules Gemini must
  follow.

## Draft One Post

Use a dry run to inspect the exact prompt:

```bash
python pipeline\draft_posts.py --only complete-guide-erectile-dysfunction --dry-run
```

Draft one post with Gemini 3 Flash and Google Search grounding:

```bash
python pipeline\draft_posts.py --only complete-guide-erectile-dysfunction
```

Draft by tier or in small batches:

```bash
python pipeline\draft_posts.py --tier 1 --limit 3
python pipeline\draft_posts.py --tier 2 --limit 10
```

Draft files are written to:

```text
pipeline\drafts\<slug>.md
```

Each draft has front matter with `status: draft`, grounding sources, inline
links, word count, and generation metadata.

## Human Review Gate

Editors should review each Markdown file in `pipeline\drafts`, improve the
article, verify citations, add original perspective, and change:

```yaml
status: draft
```

to:

```yaml
status: reviewed
```

For YMYL posts, verify medical disclaimers and send Tier 1 posts through named
medical review before import.

## Build `blog-posts.json`

Build with warnings:

```bash
python pipeline\build_blog_json.py
```

For the initial Sanity import without confirmed clinician credentials:

```bash
python pipeline\build_blog_json.py --minimal-attribution
```

That writes every post with `authorKey: editorial` and omits
`medicalReviewerKey`. Per-post attribution intent still lives in
`ideas.json` for a later update.

Enforce reviewed-only drafts:

```bash
python pipeline\build_blog_json.py --require-reviewed --strict
```

The assembler writes:

```text
blog-posts.json
```

It validates:

- internal `/blog/<slug>` links are known and allowed
- `## Sources` exists
- word count fits the tier target
- non-pillar posts mention HEZKUE
- medical-review posts include clinician guidance

## Week 1: Publish Pillars

From the repo root:

```bash
python blogs\pipeline\build_blog_json.py --minimal-attribution
npm run sanity:schedule -- --dry-run --minimal-attribution --file blogs/blog-posts.json
```

Confirm Tier 1 pillar posts are scheduled in Week 1 and that no posts are
backdated.

When ready to import without clinician attribution:

```bash
npm run sanity:push-blog
npm run sanity:sync
```

Or explicitly:

```bash
npm run sanity:schedule -- --live --minimal-attribution --file blogs/blog-posts.json
npm run sanity:sync
```

## Add clinician attribution later

When author and medical reviewer details are confirmed:

1. Copy `pipeline\authors.verified.example.json` as a guide and fill in
   verified names, bios, and credentials in `pipeline\authors.json`.
2. Rebuild full attribution JSON:

```bash
python pipeline\build_blog_json.py
```

3. Dry-run the attribution patch (works on scheduled and already-published posts):

```bash
npm run sanity:update-attribution -- --dry-run --file blogs/blog-posts.json
```

4. Apply live:

```bash
npm run sanity:update-attribution -- --live --file blogs/blog-posts.json
npm run sanity:sync
```

Optional filters:

```bash
npm run sanity:update-attribution -- --live --file blogs/blog-posts.json --tier 1
npm run sanity:update-attribution -- --live --file blogs/blog-posts.json --slug complete-guide-erectile-dysfunction
```

## Weeks 2-6: Backfill

The existing scheduler publishes Tier 2 and Tier 3 posts in batches controlled
by:

```json
"backfillPerWeek": 35
```

Do not backdate. Update `pipeline\authors.json` if the rollout date changes,
then rebuild `blog-posts.json` and rerun the dry run.

## Months 2-7: Stagger

Tier 4 posts are scheduled from week 7 onward using:

```json
"staggerPerWeek": 4
```

Monitor Google Search Console weekly and update underperforming posts. When a
post is materially refreshed, update its draft and rebuild JSON so
`lastReviewedAt` reflects the review date.

## Notes

- Outbound citations improve credibility; they are not backlinks to your site.
- Gemini grounding metadata may include Google redirect URLs. Use the original
  publisher links in the Markdown.
- The blog renderer supports headings, lists, blockquotes, bold text, inline
  links, and simple Markdown tables.
