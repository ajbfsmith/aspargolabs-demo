"""Parse Ideas.md into pipeline/ideas.json.

The parser intentionally produces a reviewable first pass. It captures all 300
briefs, then applies deterministic defaults from clusters.json so downstream
drafting never asks Gemini to invent schema, scheduling, or link structure.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IDEAS_MD = ROOT / "Ideas.md"
DEFAULT_CLUSTERS_JSON = ROOT / "pipeline" / "clusters.json"
DEFAULT_OUTPUT = ROOT / "pipeline" / "ideas.json"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

POST_MARKER_RE = re.compile(r"\*\*(T(?P<tier>[1-4])-(?P<number>\d{3}))\*\*")
CLUSTER_RE = re.compile(r"^## Cluster (?P<code>[A-O]): (?P<title>.+)$")
FIELD_RE = re.compile(r"^- \*\*(?P<name>Slug|Title|Intent|Must mention):\*\* ?(?P<value>.*)$")
INLINE_ENTRY_RE = re.compile(
    r"^\*\*(?P<id>T(?P<tier>[34])-(?P<number>\d{3}))\*\*\s+[—-]\s+(?P<title>.+)$"
)

PILLAR_DEFAULTS: dict[str, dict[str, str]] = {
    "causes-risk-factors": {
        "code": "A",
        "clusterTitle": "Causes and Risk Factors",
        "tag": "Science",
        "coverColor": "from-teal/20 to-void",
    },
    "treatment-medication": {
        "code": "B",
        "clusterTitle": "ED Treatment and Medication",
        "tag": "Guide",
        "coverColor": "from-teal/15 to-void",
    },
    "science-mechanism": {
        "code": "C",
        "clusterTitle": "Erection Science and Mechanism",
        "tag": "Science",
        "coverColor": "from-teal/15 to-void",
    },
    "lifestyle-optimization": {
        "code": "D",
        "clusterTitle": "Lifestyle and Optimization",
        "tag": "Wellness",
        "coverColor": "from-[#00FF88]/15 to-void",
    },
    "comparison-posts": {
        "code": "F",
        "clusterTitle": "ED Treatment Comparisons",
        "tag": "Science",
        "coverColor": "from-teal/20 to-void",
    },
    "concerns-symptoms": {
        "code": "G",
        "clusterTitle": "ED Symptoms and Concerns",
        "tag": "Wellness",
        "coverColor": "from-[#00FF88]/15 to-void",
    },
    "practical-how-to": {
        "code": "H",
        "clusterTitle": "Practical ED How-To Guides",
        "tag": "Guide",
        "coverColor": "from-teal/15 to-void",
    },
    "patient-journey-stories": {
        "code": "I",
        "clusterTitle": "Patient Journey Stories",
        "tag": "Wellness",
        "coverColor": "from-[#00FF88]/15 to-void",
    },
    "hezkue-product": {
        "code": "O",
        "clusterTitle": "HEZKUE Product Guides",
        "tag": "Product",
        "coverColor": "from-[#F0A500]/15 to-void",
    },
}


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-")


def clean_title(title: str) -> str:
    return title.strip().strip('"').strip()


def split_must_mentions(raw: str) -> list[str]:
    if not raw:
        return []
    parts = re.split(r",\s+|; |\s+\+ |\s+->\s+", raw)
    return [part.strip(" .") for part in parts if part.strip(" .")]


def infer_target_intent(raw: str, tier: int, title: str) -> str:
    lower = f"{raw} {title}".lower()
    if "commercial" in lower or "review" in lower or "worth it" in lower:
        return "commercial"
    if "navigational" in lower:
        return "navigational"
    if tier == 4 and "hezkue" in lower:
        return "commercial"
    return "informational"


def infer_keywords(title: str, slug: str) -> list[str]:
    words = [word for word in re.split(r"[-\s:,.()]+", f"{title} {slug}".lower()) if word]
    stop = {
        "a",
        "an",
        "and",
        "are",
        "can",
        "do",
        "does",
        "for",
        "from",
        "how",
        "if",
        "in",
        "is",
        "it",
        "of",
        "or",
        "the",
        "to",
        "vs",
        "what",
        "when",
        "which",
        "why",
        "with",
        "you",
        "your",
    }
    keyword_words: list[str] = []
    for word in words:
        if word not in stop and word not in keyword_words:
            keyword_words.append(word)
    primary = " ".join(keyword_words[:4]).strip() or title.lower()
    secondary = " ".join(keyword_words[:3]).strip()
    return [kw for kw in [primary, secondary] if kw]


def infer_hezkue_type(tier: int, cluster_code: str | None, title: str) -> str:
    lower = title.lower()
    if cluster_code == "O" or "hezkue" in lower:
        return "product_focus"
    if " vs " in lower or "comparison" in lower or cluster_code == "F":
        return "comparison"
    if tier == 4:
        return "featured"
    return "educational_cta"


def is_medical_review_required(tier: int, cluster_code: str | None, must_mentions: list[str], title: str) -> bool:
    medical_terms = (
        "heart",
        "diabetes",
        "nitrate",
        "blood pressure",
        "kidney",
        "prostate",
        "radiation",
        "spinal",
        "medication",
        "surgery",
        "side effect",
    )
    text = " ".join([title, *must_mentions]).lower()
    return tier == 1 or cluster_code in {"A", "B", "C", "G", "K", "O"} or any(
        term in text for term in medical_terms
    )


def load_clusters(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def cluster_by_code(config: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {cluster["code"]: cluster for cluster in config["clusters"]}


def cluster_by_id(config: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {cluster["clusterId"]: cluster for cluster in config["clusters"]}


def enrich_entry(entry: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    by_code = cluster_by_code(config)
    by_id = cluster_by_id(config)
    defaults = config["defaults"]
    tier = entry["tier"]
    code = entry.get("cluster")

    if tier == 1:
        cluster_id = config.get("tier1Clusters", {}).get(entry["slug"], "causes-risk-factors")
        cluster = by_id.get(cluster_id, {})
        code = cluster.get("code") or PILLAR_DEFAULTS.get(cluster_id, {}).get("code")
        pillar_slug = None
        is_pillar = True
    else:
        cluster = by_code.get(code or "", {})
        cluster_id = cluster.get("clusterId", defaults.get("clusterId", "general-ed"))
        pillar_slug = cluster.get("pillarSlug") or defaults["secondaryPillarSlug"]
        is_pillar = False

    cluster_title = cluster.get("clusterTitle") or PILLAR_DEFAULTS.get(cluster_id, {}).get(
        "clusterTitle", "Erectile Dysfunction Guide"
    )
    tag = cluster.get("tag") or PILLAR_DEFAULTS.get(cluster_id, {}).get("tag") or defaults["tag"]
    cover_color = cluster.get("coverColor") or PILLAR_DEFAULTS.get(cluster_id, {}).get(
        "coverColor", defaults["coverColor"]
    )

    target_keywords = infer_keywords(entry["title"], entry["slug"])
    focus_keyword = target_keywords[0]
    cta_type = infer_hezkue_type(tier, code, entry["title"])
    must_mentions = entry.get("required_talking_points", [])

    enriched = {
        **entry,
        "cluster": code,
        "clusterId": cluster_id,
        "clusterTitle": cluster_title,
        "pillarSlug": pillar_slug,
        "isPillar": is_pillar,
        "tag": tag,
        "coverColor": cover_color,
        "authorKey": cluster.get("authorKey", defaults["authorKey"]),
        "medicalReviewerKey": cluster.get("medicalReviewerKey", defaults["medicalReviewerKey"]),
        "target_intent": infer_target_intent(entry.get("intent", ""), tier, entry["title"]),
        "target_keywords": target_keywords,
        "focusKeyword": focus_keyword,
        "hezkue_mention_type": cta_type,
        "medical_review_required": is_medical_review_required(tier, code, must_mentions, entry["title"]),
        "cta_button_text": config["product"]["ctaText"],
        "cta_link": config["product"]["ctaLink"],
    }

    if not enriched["medical_review_required"]:
        enriched.pop("medicalReviewerKey", None)

    return enriched


def parse_structured_block(lines: list[str], start: int, marker: re.Match[str]) -> tuple[dict[str, Any], int]:
    tier = int(marker.group("tier"))
    entry: dict[str, Any] = {
        "id": marker.group(0).strip("*"),
        "tier": tier,
        "required_talking_points": [],
    }
    index = start + 1
    current_field: str | None = None

    while index < len(lines):
        line = lines[index]
        if (
            POST_MARKER_RE.search(line)
            or INLINE_ENTRY_RE.search(line)
            or CLUSTER_RE.match(line.strip())
            or line.startswith("# TIER ")
        ):
            break

        field_match = FIELD_RE.match(line)
        if field_match:
            current_field = field_match.group("name").lower().replace(" ", "_")
            value = field_match.group("value").strip()
            if current_field == "slug":
                entry["slug"] = value.strip("`")
            elif current_field == "title":
                entry["title"] = clean_title(value)
            elif current_field == "intent":
                entry["intent"] = value
            elif current_field == "must_mention":
                entry["required_talking_points"] = split_must_mentions(value)
            index += 1
            continue

        if current_field == "must_mention" and line.startswith("  - "):
            entry["required_talking_points"].append(line[4:].strip())

        index += 1

    if "slug" not in entry and "title" in entry:
        entry["slug"] = slugify(entry["title"])
    return entry, index


def parse_ideas(markdown: str, config: dict[str, Any]) -> list[dict[str, Any]]:
    lines = markdown.splitlines()
    entries: list[dict[str, Any]] = []
    current_cluster_code: str | None = None
    current_cluster_note: str | None = None
    index = 0

    while index < len(lines):
        line = lines[index].strip()

        cluster_match = CLUSTER_RE.match(line)
        if cluster_match:
            current_cluster_code = cluster_match.group("code")
            current_cluster_note = None
            index += 1
            continue

        if current_cluster_code and line.startswith("*") and line.endswith("*"):
            current_cluster_note = line.strip("*")

        inline_match = INLINE_ENTRY_RE.match(line)
        if inline_match:
            title = clean_title(inline_match.group("title"))
            tier = int(inline_match.group("tier"))
            note_points = [current_cluster_note] if current_cluster_note else []
            entry = {
                "id": inline_match.group("id"),
                "tier": tier,
                "cluster": current_cluster_code,
                "slug": slugify(title),
                "title": title,
                "intent": current_cluster_note or "",
                "required_talking_points": note_points,
            }
            entries.append(enrich_entry(entry, config))
            index += 1
            continue

        marker = POST_MARKER_RE.search(line)
        if marker:
            entry, next_index = parse_structured_block(lines, index, marker)
            if current_cluster_code:
                entry["cluster"] = current_cluster_code
            entries.append(enrich_entry(entry, config))
            index = next_index
            continue

        index += 1

    return entries


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse Ideas.md into ideas.json")
    parser.add_argument("--input", type=Path, default=DEFAULT_IDEAS_MD)
    parser.add_argument("--clusters", type=Path, default=DEFAULT_CLUSTERS_JSON)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    config = load_clusters(args.clusters)
    markdown = args.input.read_text(encoding="utf-8")
    ideas = parse_ideas(markdown, config)
    result = {
        "source": str(args.input.relative_to(ROOT)),
        "count": len(ideas),
        "ideas": ideas,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(ideas)} ideas to {args.output}")


if __name__ == "__main__":
    main()
