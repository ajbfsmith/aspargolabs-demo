"""Assemble reviewed Markdown drafts into the Sanity blog-posts JSON schema."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import frontmatter


ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / "pipeline"
DEFAULT_IDEAS_JSON = PIPELINE / "ideas.json"
DEFAULT_AUTHORS_JSON = PIPELINE / "authors.json"
DEFAULT_DRAFTS_DIR = PIPELINE / "drafts"
DEFAULT_OUTPUT = ROOT / "blog-posts.json"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

WORD_RE = re.compile(r"\b[\w'-]+\b")
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
MARKDOWN_SYNTAX_RE = re.compile(r"[*_`>#\[\]()]")
TIER_WORD_RANGES = {
    1: (2000, 4000),
    2: (800, 1500),
    3: (500, 800),
    4: (600, 1000),
}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def get_ideas(path: Path) -> list[dict[str, Any]]:
    data = load_json(path)
    ideas = data.get("ideas", data)
    if not isinstance(ideas, list):
        raise ValueError(f"{path} must contain an 'ideas' list")
    return ideas


def word_count(text: str) -> int:
    return len(WORD_RE.findall(text))


def strip_markdown(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^[-*>]\s*", "", text, flags=re.MULTILINE)
    return MARKDOWN_SYNTAX_RE.sub("", text).strip()


def first_paragraph(markdown: str) -> str:
    for block in markdown.split("\n\n"):
        clean = strip_markdown(block)
        if clean and not clean.lower().startswith("sources"):
            return clean
    return ""


def sentence_excerpt(text: str, max_chars: int = 180) -> str:
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return text
    clipped = text[:max_chars].rsplit(" ", 1)[0].rstrip(".,;:")
    return f"{clipped}."


def meta_description(text: str, max_chars: int = 160) -> str:
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0].rstrip(".,;:") + "."


def read_time(words: int) -> str:
    return f"{max(1, math.ceil(words / 200))} min read"


def get_title(idea: dict[str, Any]) -> str:
    return str(idea.get("title", idea["slug"]))


def get_anchor(idea: dict[str, Any]) -> str:
    keywords = idea.get("target_keywords") or []
    return str(idea.get("focusKeyword") or (keywords[0] if keywords else get_title(idea)))


def build_internal_link_allowlist(idea: dict[str, Any], all_ideas: list[dict[str, Any]]) -> list[dict[str, str]]:
    by_slug = {item["slug"]: item for item in all_ideas}
    pillars = [item for item in all_ideas if item.get("tier") == 1]
    links: list[dict[str, str]] = []

    def add(slug: str | None, reason: str) -> None:
        if not slug or slug == idea["slug"] or slug not in by_slug:
            return
        if any(link["slug"] == slug for link in links):
            return
        target = by_slug[slug]
        links.append({"slug": slug, "url": f"/blog/{slug}", "anchor": get_anchor(target), "reason": reason})

    if idea.get("tier") == 1:
        for pillar in pillars:
            if len(links) >= 2:
                break
            if pillar.get("clusterId") == idea.get("clusterId"):
                add(pillar["slug"], "sibling cornerstone")
        for pillar in pillars:
            if len(links) >= 2:
                break
            add(pillar["slug"], "related cornerstone")
        return links

    add(idea.get("pillarSlug"), "primary pillar")
    add("complete-guide-erectile-dysfunction", "core ED guide")
    same_cluster = [
        item
        for item in all_ideas
        if item.get("clusterId") == idea.get("clusterId") and item.get("tier") == idea.get("tier")
    ]
    slugs = [item["slug"] for item in same_cluster]
    if idea["slug"] in slugs:
        current_index = slugs.index(idea["slug"])
        neighbors = same_cluster[max(0, current_index - 1) : current_index] + same_cluster[current_index + 1 : current_index + 2]
    else:
        neighbors = [item for item in same_cluster if item["slug"] != idea["slug"]][:2]
    for neighbor in neighbors:
        add(neighbor["slug"], "adjacent cluster post")
    if idea.get("tier") in {3, 4}:
        for pillar in pillars:
            if len([link for link in links if "pillar" in link["reason"] or "cornerstone" in link["reason"]]) >= 2:
                break
            add(pillar["slug"], "supporting cornerstone")
    return links


def validate_draft(
    slug: str,
    markdown: str,
    metadata: dict[str, Any],
    idea: dict[str, Any],
    all_ideas: list[dict[str, Any]],
    require_reviewed: bool,
) -> list[str]:
    warnings: list[str] = []
    status = metadata.get("status", "draft")
    if require_reviewed and status != "reviewed":
        warnings.append(f"{slug}: status is {status!r}; expected 'reviewed'")

    words = word_count(markdown)
    low, high = TIER_WORD_RANGES.get(int(idea.get("tier", 4)), (0, 100000))
    if words < low or words > high:
        warnings.append(f"{slug}: {words} words outside tier {idea.get('tier')} target range {low}-{high}")

    if "## Sources" not in markdown:
        warnings.append(f"{slug}: missing final '## Sources' section")

    all_slugs = {item["slug"] for item in all_ideas}
    allowed_slugs = {link["slug"] for link in build_internal_link_allowlist(idea, all_ideas)}
    for _, url in LINK_RE.findall(markdown):
        if url.startswith("/blog/"):
            linked_slug = url.removeprefix("/blog/").strip("/")
            if linked_slug not in all_slugs:
                warnings.append(f"{slug}: internal link points to unknown slug {linked_slug!r}")
            elif linked_slug not in allowed_slugs:
                warnings.append(f"{slug}: internal link {linked_slug!r} is not in the allowlist")

    if idea.get("tier") != 1 and "hezkue" not in markdown.lower():
        warnings.append(f"{slug}: non-pillar draft is missing HEZKUE CTA language")

    if idea.get("medical_review_required"):
        lower = markdown.lower()
        if not any(phrase in lower for phrase in ["talk to your doctor", "speak with a doctor", "consult your doctor", "clinician"]):
            warnings.append(f"{slug}: medical-review draft should include clinician guidance/disclaimer")

    return warnings


def load_drafts(drafts_dir: Path) -> dict[str, frontmatter.Post]:
    drafts: dict[str, frontmatter.Post] = {}
    if not drafts_dir.exists():
        return drafts
    for path in sorted(drafts_dir.glob("*.md")):
        post = frontmatter.load(path)
        slug = str(post.metadata.get("slug") or path.stem)
        drafts[slug] = post
    return drafts


def build_post_object(idea: dict[str, Any], draft: frontmatter.Post) -> dict[str, Any]:
    content = draft.content.strip()
    words = int(draft.metadata.get("word_count") or word_count(content))
    excerpt = str(draft.metadata.get("excerpt") or sentence_excerpt(first_paragraph(content)))
    meta = str(draft.metadata.get("metaDescription") or meta_description(excerpt))
    title = str(draft.metadata.get("title") or get_title(idea))
    post: dict[str, Any] = {
        "slug": idea["slug"],
        "title": title,
        "excerpt": excerpt,
        "readTime": read_time(words),
        "tag": idea.get("tag", "Science"),
        "coverColor": idea.get("coverColor", "from-teal/20 to-void"),
        "tier": idea.get("tier"),
        "clusterId": idea.get("clusterId"),
        "clusterTitle": idea.get("clusterTitle"),
        "authorKey": idea.get("authorKey", "clinical"),
        "seoTitle": str(draft.metadata.get("seoTitle") or title),
        "metaDescription": meta,
        "focusKeyword": idea.get("focusKeyword"),
        "content": content,
        "lastReviewedAt": str(draft.metadata.get("lastReviewedAt") or datetime.now(timezone.utc).isoformat()),
    }

    if idea.get("isPillar"):
        post["isPillar"] = True
    elif idea.get("pillarSlug"):
        post["pillarSlug"] = idea["pillarSlug"]

    if idea.get("medicalReviewerKey"):
        post["medicalReviewerKey"] = idea["medicalReviewerKey"]
    if draft.metadata.get("canonicalUrl"):
        post["canonicalUrl"] = draft.metadata["canonicalUrl"]
    if draft.metadata.get("noindex") is not None:
        post["noindex"] = bool(draft.metadata["noindex"])

    return {key: value for key, value in post.items() if value is not None}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build blog-posts.json from reviewed Markdown drafts")
    parser.add_argument("--ideas", type=Path, default=DEFAULT_IDEAS_JSON)
    parser.add_argument("--authors", type=Path, default=DEFAULT_AUTHORS_JSON)
    parser.add_argument("--drafts-dir", type=Path, default=DEFAULT_DRAFTS_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--require-reviewed", action="store_true")
    parser.add_argument("--only", help="Build only one slug")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4])
    parser.add_argument("--strict", action="store_true", help="Exit non-zero on warnings")
    args = parser.parse_args()

    ideas = get_ideas(args.ideas)
    if args.only:
        ideas = [idea for idea in ideas if idea["slug"] == args.only]
    if args.tier:
        ideas = [idea for idea in ideas if idea.get("tier") == args.tier]

    all_ideas = get_ideas(args.ideas)
    authors = load_json(args.authors)
    drafts = load_drafts(args.drafts_dir)
    warnings: list[str] = []
    posts: list[dict[str, Any]] = []

    for idea in ideas:
        draft = drafts.get(idea["slug"])
        if not draft:
            continue
        warnings.extend(
            validate_draft(
                slug=idea["slug"],
                markdown=draft.content,
                metadata=draft.metadata,
                idea=idea,
                all_ideas=all_ideas,
                require_reviewed=args.require_reviewed,
            )
        )
        posts.append(build_post_object(idea, draft))

    result = {
        "config": authors["config"],
        "authors": authors["authors"],
        "medicalReviewers": authors.get("medicalReviewers", []),
        "posts": posts,
    }
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {len(posts)} posts to {args.output}")
    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"- {warning}")
        if args.strict:
            sys.exit(1)


if __name__ == "__main__":
    main()
