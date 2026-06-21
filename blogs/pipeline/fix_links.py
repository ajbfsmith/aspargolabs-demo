"""Fix internal links: broken slugs and missing cross-links."""

import json
import re
from pathlib import Path
import frontmatter

ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / "pipeline"
IDEAS_JSON = PIPELINE / "ideas.json"
DRAFTS_DIR = PIPELINE / "drafts"

LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

BROKEN_MAP = {
    "/blog/what-is-a-normal-erection-supposed-feel": "/blog/what-is-a-normal-erection-supposed-to-feel-like",
    "/blog/oral-ed-medication-topical": "/blog/oral-ed-medication-vs-topical-alprostadil-cream-comparison",
    "/blog/myth-myth-ed-medication-is-addictive": "/blog/myth-ed-medication-is-addictive",
}

def get_anchor(idea: dict) -> str:
    return str(idea.get("focusKeyword") or idea.get("target_keywords", [None])[0] or idea["title"])

def fix_broken_links(content: str) -> str:
    for old, new in BROKEN_MAP.items():
        content = content.replace(old, new)
    return content

def add_internal_links(slug: str, idea: dict, all_ideas: list[dict]) -> str:
    path = DRAFTS_DIR / f"{slug}.md"
    if not path.exists():
        return ""
    
    post = frontmatter.load(path)
    content = post.content
    
    # Check if already has internal links
    links = LINK_RE.findall(content)
    internal = [u for _, u in links if u.startswith("/blog/")]
    
    # Determine what links we SHOULD have
    by_slug = {i["slug"]: i for i in all_ideas}
    pillars = [i for i in all_ideas if i.get("tier") == 1]
    
    to_add = []
    
    # 1. Ensure pillar link
    pillar_slug = idea.get("pillarSlug")
    if pillar_slug and pillar_slug in by_slug:
        if not any(f"/blog/{pillar_slug}" in u for u in internal):
            target = by_slug[pillar_slug]
            to_add.append((get_anchor(target), f"/blog/{pillar_slug}"))
    
    # 2. Ensure at least one other internal link if missing
    if not internal and not to_add:
        # Link to the core guide if nothing else
        core_slug = "complete-guide-erectile-dysfunction"
        if core_slug in by_slug and core_slug != slug:
            target = by_slug[core_slug]
            to_add.append((get_anchor(target), f"/blog/{core_slug}"))

    if not to_add:
        return content

    # Insert links into the content
    # We'll try to insert them into the first paragraph after the intro sentence
    lines = content.split("\n")
    inserted = False
    for i, line in enumerate(lines):
        if line.strip() and not line.startswith("#") and not line.startswith("---"):
            # Found first paragraph. Append links to the end of it or as a new line.
            link_str = " ".join([f"[{label}]({url})" for label, url in to_add])
            lines[i] = line.strip() + " For more context, see our " + link_str + "."
            inserted = True
            break
    
    if not inserted:
        # Fallback: just append to top
        link_str = " ".join([f"[{label}]({url})" for label, url in to_add])
        lines.insert(0, f"Related: {link_str}\n")

    return "\n".join(lines)

def main():
    with IDEAS_JSON.open("r", encoding="utf-8") as f:
        ideas = json.load(f)["ideas"]
    
    all_slugs = [i["slug"] for i in ideas]
    by_slug = {i["slug"]: i for i in ideas}

    print("Fixing broken links...")
    for slug in all_slugs:
        path = DRAFTS_DIR / f"{slug}.md"
        if not path.exists(): continue
        post = frontmatter.load(path)
        new_content = fix_broken_links(post.content)
        if new_content != post.content:
            post.content = new_content
            path.write_text(frontmatter.dumps(post), encoding="utf-8")
            print(f"  Fixed broken links in {slug}")

    print("Adding missing internal links and fixing metadata...")
    for slug in all_slugs:
        idea = by_slug[slug]
        path = DRAFTS_DIR / f"{slug}.md"
        if not path.exists(): continue
        
        post = frontmatter.load(path)
        original_content = post.content
        original_metadata = json.dumps(post.metadata, sort_keys=True)
        
        # Re-run missing internal check
        links = LINK_RE.findall(post.content)
        internal = [u for _, u in links if u.startswith("/blog/")]
        
        # Update metadata links if they were fixed
        if "inline_links" in post.metadata:
            new_inline_links = []
            for link in post.metadata["inline_links"]:
                if link["url"] in BROKEN_MAP:
                    link["url"] = BROKEN_MAP[link["url"]]
                new_inline_links.append(link)
            post.metadata["inline_links"] = new_inline_links
        
        pillar_slug = idea.get("pillarSlug")
        has_pillar = not pillar_slug or any(f"/blog/{pillar_slug}" in u for u in internal)
        
        if not internal or not has_pillar:
            new_content = add_internal_links(slug, idea, ideas)
            if new_content and new_content != post.content:
                post.content = new_content
                print(f"  Added links to {slug}")

        if post.content != original_content or json.dumps(post.metadata, sort_keys=True) != original_metadata:
            path.write_text(frontmatter.dumps(post), encoding="utf-8")
            print(f"  Updated {slug} (metadata/content)")

if __name__ == "__main__":
    main()
