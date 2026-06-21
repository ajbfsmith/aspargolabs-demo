"""Expand Tier 1 blog posts to meet the 2,000-4,000 word target."""

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

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def word_count(text: str) -> int:
    return len(WORD_RE.findall(text))

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

def build_expansion_prompt(idea: dict[str, Any], current_content: str) -> str:
    return f"""The following is an existing draft for a Tier 1 pillar post (cornerstone content). 
It is currently too short (approx {word_count(current_content)} words). 
I need you to expand it to be between 2,500 and 3,500 words.

Post Title: {idea.get('title')}
Focus Keyword: {idea.get('focusKeyword')}

Expansion Instructions:
1. Maintain the existing tone and quality standards.
2. Add more depth to existing sections.
3. Add NEW sections that provide comprehensive coverage of the topic.
4. Include more detailed physiological explanations, clinical context, and practical advice.
5. Add a detailed FAQ section at the end (before Sources) if not already present.
6. Ensure you use Google Search grounding to find more specific data, statistics, and recent clinical findings (up to 2026).
7. Maintain all existing internal links and HEZKUE mentions.
8. Add 3-5 MORE external citations (total should be 6-10 for a pillar post).
9. Return the FULL expanded article in Markdown. Do not include front matter.

Current Draft:
---
{current_content}
"""

def expand_one(
    client: genai.Client,
    idea: dict[str, Any],
    system_prompt: str,
    output_dir: Path,
    model: str,
    temperature: float,
    dry_run: bool,
) -> None:
    path = output_dir / f"{idea['slug']}.md"
    if not path.exists():
        print(f"[skip] {idea['slug']} does not exist")
        return

    post = frontmatter.load(path)
    current_wc = word_count(post.content)
    if current_wc >= 2000:
        print(f"[skip] {idea['slug']} already has {current_wc} words")
        return

    print(f"[expanding] {idea['slug']} ({current_wc} words)...")
    user_prompt = build_expansion_prompt(idea, post.content)
    
    if dry_run:
        print(f"DRY RUN: Would expand {idea['slug']}")
        return

    response = generate_markdown(client, model, system_prompt, user_prompt, temperature)
    expanded_markdown = (getattr(response, "text", "") or "").strip()
    if not expanded_markdown:
        raise RuntimeError(f"Gemini returned empty text for {idea['slug']}")

    post.content = expanded_markdown
    post.metadata["word_count"] = word_count(expanded_markdown)
    post.metadata["expanded_at"] = datetime.now(timezone.utc).isoformat()
    post.metadata["model_expansion"] = model

    path.write_text(frontmatter.dumps(post), encoding="utf-8")
    print(f"[expanded] {idea['slug']} -> {post.metadata['word_count']} words")

def main() -> None:
    parser = argparse.ArgumentParser(description="Expand Tier 1 posts")
    parser.add_argument("--ideas", type=Path, default=DEFAULT_IDEAS_JSON)
    parser.add_argument("--system-prompt", type=Path, default=DEFAULT_SYSTEM_PROMPT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_DRAFTS_DIR)
    parser.add_argument("--only", help="Expand only one slug")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    load_dotenv(DEFAULT_ENV_FILE)
    load_dotenv(ROOT / ".env")

    with args.ideas.open("r", encoding="utf-8") as f:
        ideas = json.load(f)["ideas"]

    selected = [i for i in ideas if i["tier"] == 1]
    if args.only:
        selected = [i for i in selected if i["slug"] == args.only]

    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    system_prompt = args.system_prompt.read_text(encoding="utf-8")
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY")) if not args.dry_run else None

    for idea in selected:
        try:
            expand_one(client, idea, system_prompt, args.output_dir, model, 0.45, args.dry_run)
        except Exception as e:
            print(f"[error] Failed to expand {idea['slug']}: {e}")

if __name__ == "__main__":
    main()
