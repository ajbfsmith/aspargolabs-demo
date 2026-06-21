"""Smoke-test blog drafts against pipeline quality criteria."""

from __future__ import annotations

import json
import random
import re
import sys
from collections import Counter
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parents[1]
IDEAS_JSON = ROOT / "pipeline" / "ideas.json"
AUTHORS_JSON = ROOT / "pipeline" / "authors.json"
DRAFTS_DIR = ROOT / "pipeline" / "drafts"

TIER_WORDS = {1: (2000, 4000), 2: (800, 1500), 3: (500, 800), 4: (600, 1000)}
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
DISCLAIMER = re.compile(
    r"talk to your doctor|consult your doctor|speak with a doctor|not medical advice|clinician|healthcare provider|physician",
    re.I,
)
HEZKUE = re.compile(r"hezkue", re.I)
CTA_PHRASES = re.compile(
    r"fast-acting|clinically-formulated|work in minutes|Explore HEZKUE|/checkout",
    re.I,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def load_data():
    ideas = {item["slug"]: item for item in json.load(IDEAS_JSON.open(encoding="utf-8"))["ideas"]}
    authors_data = json.load(AUTHORS_JSON.open(encoding="utf-8"))
    authors = {item["key"]: item for item in authors_data["authors"]}
    reviewers = {item["key"]: item for item in authors_data["medicalReviewers"]}
    return ideas, authors, reviewers


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def audit(slug: str, ideas: dict, authors: dict, reviewers: dict) -> dict:
    post = frontmatter.load(DRAFTS_DIR / f"{slug}.md")
    idea = ideas[slug]
    content = post.content
    tier = idea.get("tier", post.metadata.get("tier"))
    links = LINK_RE.findall(content)
    internal = [(label, url) for label, url in links if url.startswith("/blog/")]
    external = [(label, url) for label, url in links if url.startswith("http")]
    checkout = [(label, url) for label, url in links if "checkout" in url.lower()]
    wc = word_count(content)
    lo, hi = TIER_WORDS.get(tier, (0, 99999))
    author = authors.get(idea.get("authorKey", ""), {})
    reviewer = reviewers.get(idea.get("medicalReviewerKey", ""), {}) if idea.get("medicalReviewerKey") else None

    result = {
        "slug": slug,
        "tier": tier,
        "author_name": author.get("name"),
        "author_credentials": author.get("credentials"),
        "medical_reviewer": reviewer.get("name") if reviewer else None,
        "medical_review_required": bool(idea.get("medical_review_required")),
        "internal_count": len(internal),
        "external_count": len(external),
        "has_sources_section": "## Sources" in content,
        "sources_items": content.split("## Sources")[-1].count("- [") if "## Sources" in content else 0,
        "mentions_hezkue": bool(HEZKUE.search(content)),
        "has_checkout_cta": bool(checkout) or bool(CTA_PHRASES.search(content)),
        "has_medical_disclaimer": bool(DISCLAIMER.search(content)) if idea.get("medical_review_required") else True,
        "word_count": wc,
        "word_target": f"{lo}-{hi}",
        "word_count_ok": lo <= wc <= hi,
        "has_internal_link": len(internal) >= 1,
        "has_pillar_link": tier == 1 or any(
            idea.get("pillarSlug") and f"/blog/{idea['pillarSlug']}" in url for _, url in internal
        ),
        "status": post.metadata.get("status", "unknown"),
    }

    fails: list[str] = []
    if tier != 1 and not result["has_internal_link"]:
        fails.append("missing internal /blog/ link")
    if tier != 1 and not result["has_pillar_link"]:
        fails.append("missing pillar link")
    if result["external_count"] < 2:
        fails.append(f"only {result['external_count']} external citations (want 3+)")
    if not result["has_sources_section"]:
        fails.append("missing ## Sources")
    if tier != 1 and not result["mentions_hezkue"]:
        fails.append("no HEZKUE mention")
    if tier != 1 and not result["has_checkout_cta"]:
        fails.append("no CTA/checkout")
    if not result["has_medical_disclaimer"]:
        fails.append("missing medical disclaimer")
    if not result["word_count_ok"]:
        fails.append(f"word count {wc} outside {lo}-{hi}")
    if result["status"] != "draft":
        fails.append(f"status={result['status']} (expected draft until human review)")

    result["fails"] = fails
    result["pass"] = not fails
    return result


def main() -> None:
    ideas, authors, reviewers = load_data()
    all_slugs = sorted(path.stem for path in DRAFTS_DIR.glob("*.md"))
    random.seed(42)
    sample = random.sample(all_slugs, min(20, len(all_slugs)))

    print("=" * 70)
    print("SMOKE TEST: 20 random drafts (seed=42)")
    print("=" * 70)

    sample_results = []
    for slug in sample:
        result = audit(slug, ideas, authors, reviewers)
        sample_results.append(result)
        mark = "PASS" if result["pass"] else "FAIL"
        print(f"\n[{mark}] {slug} (Tier {result['tier']})")
        print(
            f"  Author: {result['author_name']} ({result['author_credentials']}) | "
            f"Reviewer: {result['medical_reviewer'] or 'none'}"
        )
        print(
            f"  Links: {result['internal_count']} internal, {result['external_count']} external | "
            f"Sources: {result['has_sources_section']} ({result['sources_items']} items)"
        )
        print(
            f"  HEZKUE: {result['mentions_hezkue']} | CTA: {result['has_checkout_cta']} | "
            f"Words: {result['word_count']} (target {result['word_target']})"
        )
        if result["fails"]:
            print(f"  Issues: {', '.join(result['fails'])}")

    passed = sum(1 for result in sample_results if result["pass"])
    print("\n" + "=" * 70)
    print(f"SUMMARY: {passed}/20 passed all automated checks")
    print("=" * 70)

    print("\nFULL CORPUS STATS (300 posts):")
    all_results = [audit(slug, ideas, authors, reviewers) for slug in all_slugs]
    hezkue_non_t1 = sum(
        1 for result in all_results if result["tier"] != 1 and result["mentions_hezkue"]
    )
    hezkue_t1 = sum(1 for result in all_results if result["tier"] == 1 and result["mentions_hezkue"])
    cta_non_t1 = sum(
        1 for result in all_results if result["tier"] != 1 and result["has_checkout_cta"]
    )
    disclaimer_req = [result for result in all_results if result["medical_review_required"]]
    disclaimer_ok = sum(1 for result in disclaimer_req if result["has_medical_disclaimer"])
    wc_fail = [result["slug"] for result in all_results if not result["word_count_ok"]]

    print(f"  Internal /blog/ links: {sum(1 for r in all_results if r['has_internal_link'])}/300")
    print(f"  ## Sources section: {sum(1 for r in all_results if r['has_sources_section'])}/300")
    print(f"  HEZKUE mention (Tier 2-4): {hezkue_non_t1}/280")
    print(f"  HEZKUE mention (Tier 1): {hezkue_t1}/20")
    print(f"  Checkout/CTA (Tier 2-4): {cta_non_t1}/280")
    print(f"  Medical disclaimer (required posts): {disclaimer_ok}/{len(disclaimer_req)}")
    print(f"  Word count in tier range: {300 - len(wc_fail)}/300")
    print(f"  Status still draft: {sum(1 for r in all_results if r['status'] == 'draft')}/300")

    print("\nAUTHOR IDENTITY AUDIT:")
    clinical = sum(1 for slug in all_slugs if ideas[slug].get("authorKey") == "clinical")
    editorial = sum(1 for slug in all_slugs if ideas[slug].get("authorKey") == "editorial")
    reviewed = sum(1 for slug in all_slugs if ideas[slug].get("medicalReviewerKey") == "urology")
    print(f"  Dr. James Rothwell (clinical authorKey): {clinical} posts")
    print(f"  Accelerate Health Editorial (editorial authorKey): {editorial} posts")
    print(f"  Dr. Elena Vasquez (medicalReviewerKey): {reviewed} posts")
    print("  WARNING: These are configured personas in authors.json, not verified real clinicians.")
    print("  Author/reviewer bios are injected at publish time from JSON — not inside draft markdown.")

    issue_counts = Counter()
    for result in sample_results:
        for fail in result["fails"]:
            issue_counts[fail.split("(")[0].strip()] += 1
    if issue_counts:
        print("\nMost common issues in sample of 20:")
        for issue, count in issue_counts.most_common():
            print(f"  {issue}: {count}/20")

    if wc_fail:
        print(f"\nWord-count failures by tier:")
        by_tier = Counter(ideas[slug]["tier"] for slug in wc_fail[:15])
        for tier, count in sorted(by_tier.items()):
            print(f"  Tier {tier}: {count} (showing first 15 examples)")
        for slug in wc_fail[:8]:
            result = next(r for r in all_results if r["slug"] == slug)
            print(f"    - {slug}: {result['word_count']} words (target {result['word_target']})")


if __name__ == "__main__":
    main()
