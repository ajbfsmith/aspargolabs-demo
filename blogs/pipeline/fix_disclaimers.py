"""Insert a standard medical disclaimer into YMYL drafts that are missing one."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import frontmatter

ROOT = Path(__file__).resolve().parents[1]
IDEAS_JSON = ROOT / "pipeline" / "ideas.json"
DRAFTS_DIR = ROOT / "pipeline" / "drafts"

DISCLAIMER_RE = re.compile(
    r"talk to your doctor|consult your doctor|speak with a doctor|consult a doctor|"
    r"not medical advice|clinician|healthcare provider|healthcare professional|physician",
    re.I,
)

DISCLAIMER_BLOCK = (
    "\n\n**Medical Disclaimer:** This article is for informational purposes only and does "
    "not constitute medical advice. Always talk to your doctor or qualified healthcare "
    "provider before starting, stopping, or changing any treatment for erectile dysfunction "
    "or related health conditions.\n"
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def insert_disclaimer(content: str) -> str:
    marker = "## Sources"
    if marker in content:
        head, tail = content.split(marker, 1)
        return head.rstrip() + DISCLAIMER_BLOCK + "\n" + marker + tail
    return content.rstrip() + DISCLAIMER_BLOCK


def main() -> None:
    ideas = json.load(IDEAS_JSON.open(encoding="utf-8"))["ideas"]
    updated = 0

    for idea in ideas:
        if not idea.get("medical_review_required"):
            continue
        path = DRAFTS_DIR / f"{idea['slug']}.md"
        if not path.exists():
            continue
        post = frontmatter.load(path)
        if DISCLAIMER_RE.search(post.content):
            continue
        post.content = insert_disclaimer(post.content)
        path.write_text(frontmatter.dumps(post), encoding="utf-8")
        updated += 1
        print(f"  Added disclaimer to {idea['slug']}")

    print(f"\nUpdated {updated} drafts with medical disclaimers.")


if __name__ == "__main__":
    main()
