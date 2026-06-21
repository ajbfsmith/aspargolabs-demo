"""Draft one Accelerate Health blog post at a time with Gemini Search grounding."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import frontmatter
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential


ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / "pipeline"
DEFAULT_IDEAS_JSON = PIPELINE / "ideas.json"
DEFAULT_SYSTEM_PROMPT = PIPELINE / "prompts" / "system_prompt.md"
DEFAULT_DRAFTS_DIR = PIPELINE / "drafts"
DEFAULT_ENV_FILE = PIPELINE / ".env"

WORD_RE = re.compile(r"\b[\w'-]+\b")
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def word_count(text: str) -> int:
    return len(WORD_RE.findall(text))


def get_ideas(path: Path) -> list[dict[str, Any]]:
    data = load_json(path)
    ideas = data.get("ideas", data)
    if not isinstance(ideas, list):
        raise ValueError(f"{path} must contain an 'ideas' list")
    return ideas


def get_title(idea: dict[str, Any]) -> str:
    return str(idea.get("title", idea["slug"]))


def get_anchor(idea: dict[str, Any]) -> str:
    return str(idea.get("focusKeyword") or idea.get("target_keywords", [None])[0] or get_title(idea))


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
        links.append(
            {
                "slug": slug,
                "title": get_title(target),
                "anchor": get_anchor(target),
                "url": f"/blog/{slug}",
                "reason": reason,
            }
        )

    if idea.get("tier") == 1:
        cluster_pillars = [
            item
            for item in pillars
            if item.get("clusterId") == idea.get("clusterId") and item["slug"] != idea["slug"]
        ]
        for pillar in cluster_pillars[:2]:
            add(pillar["slug"], "sibling cornerstone")
        for pillar in pillars:
            if len(links) >= 2:
                break
            add(pillar["slug"], "related cornerstone")
        return links

    add(idea.get("pillarSlug"), "primary pillar")
    add("complete-guide-erectile-dysfunction", "core ED guide")

    same_cluster_all = [
        item
        for item in all_ideas
        if item.get("clusterId") == idea.get("clusterId")
        and item.get("tier") == idea.get("tier")
    ]
    try:
        current_index = [item["slug"] for item in same_cluster_all].index(idea["slug"])
    except ValueError:
        current_index = -1

    if current_index >= 0:
        neighbors = same_cluster_all[max(0, current_index - 1) : current_index] + same_cluster_all[
            current_index + 1 : current_index + 2
        ]
    else:
        neighbors = [item for item in same_cluster_all if item["slug"] != idea["slug"]][:2]
    for neighbor in neighbors:
        add(neighbor["slug"], "adjacent cluster post")

    if idea.get("tier") in {3, 4}:
        for pillar in pillars:
            if len([link for link in links if "cornerstone" in link["reason"] or "pillar" in link["reason"]]) >= 2:
                break
            add(pillar["slug"], "supporting cornerstone")

    return links


def format_internal_links(links: list[dict[str, str]]) -> str:
    if not links:
        return "- No internal links are available for this post."
    return "\n".join(
        f"- {link['title']} | anchor: \"{link['anchor']}\" | url: {link['url']} | reason: {link['reason']}"
        for link in links
    )


def build_user_prompt(idea: dict[str, Any], all_ideas: list[dict[str, Any]]) -> str:
    links = build_internal_link_allowlist(idea, all_ideas)
    required = "\n".join(f"- {point}" for point in idea.get("required_talking_points", []))
    keywords = ", ".join(idea.get("target_keywords", []))

    return f"""Write one complete Accelerate Health blog post.

Post brief:
- Slug: {idea['slug']}
- Title: {get_title(idea)}
- Tier: {idea.get('tier')}
- Cluster: {idea.get('clusterTitle')} ({idea.get('clusterId')})
- Target intent: {idea.get('target_intent') or idea.get('intent') or 'informational'}
- Focus keyword: {idea.get('focusKeyword')}
- Target keywords: {keywords}
- HEZKUE mention type: {idea.get('hezkue_mention_type')}
- Medical review required after draft: {idea.get('medical_review_required')}
- CTA button text: {idea.get('cta_button_text')}
- CTA link: {idea.get('cta_link')}

Required talking points:
{required}

Allowed internal links:
{format_internal_links(links)}

Additional instructions:
- Return only article Markdown.
- Do not include JSON or front matter.
- Do not use tables.
- Use Google Search grounding for medical, regulatory, statistics, and safety claims.
- Include 3-6 external source links inline and repeat them in the final `## Sources` section.
"""


def object_to_dict(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return [object_to_dict(item) for item in value]
    if isinstance(value, dict):
        return {key: object_to_dict(item) for key, item in value.items()}
    if hasattr(value, "model_dump"):
        return object_to_dict(value.model_dump(exclude_none=True))
    if hasattr(value, "to_dict"):
        return object_to_dict(value.to_dict())
    if hasattr(value, "__dict__"):
        return object_to_dict({key: item for key, item in value.__dict__.items() if not key.startswith("_")})
    return str(value)


def extract_grounding_metadata(response: Any) -> dict[str, Any]:
    candidates = getattr(response, "candidates", None) or []
    if not candidates:
        return {}
    metadata = getattr(candidates[0], "grounding_metadata", None)
    return object_to_dict(metadata) if metadata else {}


def extract_grounding_sources(metadata: dict[str, Any]) -> list[dict[str, str]]:
    sources: list[dict[str, str]] = []
    chunks = metadata.get("grounding_chunks") or metadata.get("groundingChunks") or []
    for chunk in chunks:
        web = chunk.get("web") if isinstance(chunk, dict) else None
        if not web:
            continue
        uri = web.get("uri")
        title = web.get("title") or uri
        if uri and not any(source["uri"] == uri for source in sources):
            sources.append({"title": title, "uri": uri})
    return sources


def extract_inline_links(markdown: str) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    for label, url in LINK_RE.findall(markdown):
        if not any(link["url"] == url for link in links):
            links.append({"label": label, "url": url})
    return links


def _client_error_code(exc: ClientError) -> int | None:
    code = getattr(exc, "code", None)
    return int(code) if code is not None else None


def _should_retry_gemini_error(exc: BaseException) -> bool:
    if isinstance(exc, ClientError):
        if _client_error_code(exc) in {404, 429}:
            return False
    return True


@retry(
    wait=wait_exponential(multiplier=2, min=2, max=30),
    stop=stop_after_attempt(3),
    retry=retry_if_exception(_should_retry_gemini_error),
    reraise=True,
)
def generate_markdown(client: genai.Client, model: str, system_prompt: str, user_prompt: str, temperature: float) -> Any:
    grounding_tool = types.Tool(google_search=types.GoogleSearch())
    return client.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=[grounding_tool],
            temperature=temperature,
        ),
    )


def draft_one(
    client: genai.Client,
    idea: dict[str, Any],
    all_ideas: list[dict[str, Any]],
    system_prompt: str,
    output_dir: Path,
    model: str,
    temperature: float,
    force: bool,
    dry_run: bool,
) -> Path | None:
    output_path = output_dir / f"{idea['slug']}.md"
    if output_path.exists() and not force:
        print(f"[skip] {idea['slug']} already exists")
        return output_path

    user_prompt = build_user_prompt(idea, all_ideas)
    if dry_run:
        print(f"\n--- Prompt for {idea['slug']} ---\n{user_prompt}")
        return None

    response = generate_markdown(client, model, system_prompt, user_prompt, temperature)
    markdown = (getattr(response, "text", "") or "").strip()
    if not markdown:
        raise RuntimeError(f"Gemini returned empty text for {idea['slug']}")

    grounding_metadata = extract_grounding_metadata(response)
    grounding_sources = extract_grounding_sources(grounding_metadata)
    inline_links = extract_inline_links(markdown)
    metadata = {
        "slug": idea["slug"],
        "title": get_title(idea),
        "tier": idea.get("tier"),
        "clusterId": idea.get("clusterId"),
        "clusterTitle": idea.get("clusterTitle"),
        "pillarSlug": idea.get("pillarSlug"),
        "status": "draft",
        "model": model,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "word_count": word_count(markdown),
        "focusKeyword": idea.get("focusKeyword"),
        "grounding_sources": grounding_sources,
        "inline_links": inline_links,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    post = frontmatter.Post(markdown, **metadata)
    output_path.write_text(frontmatter.dumps(post), encoding="utf-8")
    print(f"[drafted] {idea['slug']} -> {output_path}")
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Draft Accelerate Health blog posts with Gemini")
    parser.add_argument("--ideas", type=Path, default=DEFAULT_IDEAS_JSON)
    parser.add_argument("--system-prompt", type=Path, default=DEFAULT_SYSTEM_PROMPT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_DRAFTS_DIR)
    parser.add_argument("--only", help="Draft only one slug")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4])
    parser.add_argument("--limit", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without calling Gemini")
    parser.add_argument("--temperature", type=float, default=0.45)
    args = parser.parse_args()

    load_dotenv(DEFAULT_ENV_FILE)
    load_dotenv(ROOT / ".env")

    ideas = get_ideas(args.ideas)
    selected = ideas
    if args.only:
        selected = [idea for idea in selected if idea["slug"] == args.only]
    if args.tier:
        selected = [idea for idea in selected if idea.get("tier") == args.tier]
    if args.limit:
        selected = selected[: args.limit]
    if not selected:
        raise ValueError("No ideas matched the requested filters")

    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    system_prompt = args.system_prompt.read_text(encoding="utf-8")
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY")) if not args.dry_run else None

    for idea in selected:
        try:
            draft_one(
                client=client,  # type: ignore[arg-type]
                idea=idea,
                all_ideas=ideas,
                system_prompt=system_prompt,
                output_dir=args.output_dir,
                model=model,
                temperature=args.temperature,
                force=args.force,
                dry_run=args.dry_run,
            )
        except ClientError as error:
            code = _client_error_code(error)
            if code == 404:
                raise SystemExit(
                    f"Gemini model '{model}' was not found. "
                    "Set GEMINI_MODEL=gemini-2.5-flash in pipeline/.env and retry."
                ) from error
            if code == 429:
                raise SystemExit(
                    "Gemini API quota or billing cap exceeded. "
                    "Manage billing at https://ai.google.dev/gemini-api/docs/billing and retry."
                ) from error
            raise


if __name__ == "__main__":
    main()
