"""Replace em dashes in Markdown drafts with comma-based punctuation."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parents[1]
DRAFTS_DIR = ROOT / "pipeline" / "drafts"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def remove_em_dashes(text: str) -> str:
    text = text.replace(" — ", ", ")
    text = text.replace("—", ", ")
    text = re.sub(r",\s*,", ", ", text)
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r",\s+", ", ", text)
    return text


def scrub_metadata(value):
    if isinstance(value, str):
        return remove_em_dashes(value) if "—" in value else value
    if isinstance(value, list):
        return [scrub_metadata(item) for item in value]
    if isinstance(value, dict):
        return {key: scrub_metadata(item) for key, item in value.items()}
    return value


def fix_draft(path: Path) -> bool:
    post = frontmatter.load(path)
    original = post.content
    updated_content = remove_em_dashes(original)
    changed = updated_content != original

    metadata = scrub_metadata(dict(post.metadata))
    meta_changed = metadata != dict(post.metadata)

    if not changed and not meta_changed:
        return False

    post.content = updated_content
    post.metadata = metadata
    path.write_text(frontmatter.dumps(post), encoding="utf-8")
    return True


def main() -> None:
    updated = 0
    for path in sorted(DRAFTS_DIR.glob("*.md")):
        if fix_draft(path):
            updated += 1
            print(f"fixed: {path.name}")

    print(f"\nUpdated {updated} draft(s).")


if __name__ == "__main__":
    main()
