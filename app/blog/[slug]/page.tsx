import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  blogPosts,
  getPostBySlug,
  getRelatedPosts,
  formatDate,
} from "../../data/blog-posts";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} — Accelerate Health`,
    description: post.excerpt,
  };
}

function renderMarkdownContent(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let blockquoteBuffer: string[] = [];
  let key = 0;

  const flushBlockquote = () => {
    if (blockquoteBuffer.length > 0) {
      elements.push(
        <blockquote
          key={key++}
          className="border-l-2 border-teal/40 pl-6 my-8 py-1"
        >
          <p className="font-lora text-[16px] md:text-[17px] text-text-primary/80 italic leading-[1.8]">
            {blockquoteBuffer.join(" ")}
          </p>
        </blockquote>
      );
      blockquoteBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("> ")) {
      blockquoteBuffer.push(line.slice(2));
      continue;
    }
    flushBlockquote();

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="font-dm text-[24px] md:text-[28px] font-semibold text-text-primary mt-12 mb-4 leading-tight"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="font-dm text-[18px] md:text-[20px] font-semibold text-text-primary mt-8 mb-3 leading-snug"
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
      elements.push(
        <div key={key++} className="flex gap-3 my-2 ml-2">
          <span className="font-ibm text-[14px] text-teal/70 shrink-0 mt-0.5">
            {line.charAt(0)}.
          </span>
          <p className="font-lora text-[15px] md:text-[16px] text-text-secondary leading-[1.8]">
            {renderInlineFormatting(line.slice(3))}
          </p>
        </div>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={key++} className="flex gap-3 my-2 ml-2">
          <span className="font-ibm text-teal/50 shrink-0 mt-2">&#x25C7;</span>
          <p className="font-lora text-[15px] md:text-[16px] text-text-secondary leading-[1.8]">
            {renderInlineFormatting(line.slice(2))}
          </p>
        </div>
      );
    } else if (line.trim() === "") {
      continue;
    } else {
      elements.push(
        <p
          key={key++}
          className="font-lora text-[15px] md:text-[16px] text-text-secondary leading-[1.85] my-4"
        >
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }
  flushBlockquote();

  return elements;
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-text-primary font-medium">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = getRelatedPosts(slug, 3);

  return (
    <div className="grid-surface min-h-screen pt-28 md:pt-36 pb-24">
      <div className="teal-glow fixed top-0 left-1/2 -translate-x-1/2 opacity-[0.04]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-teal transition-colors mb-10 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform duration-300"
          />
          <span className="font-ibm text-[12px] uppercase tracking-wider">
            Back to Journal
          </span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 lg:gap-16">
          {/* Main article */}
          <article className="max-w-[720px]">
            {/* Header */}
            <header className="mb-10 md:mb-14">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-ibm text-[10px] text-teal/80 uppercase tracking-[0.2em] bg-teal/8 px-2.5 py-1 rounded-md border border-teal/15">
                  {post.tag}
                </span>
                <span className="font-ibm text-[11px] text-text-secondary">
                  {formatDate(post.date)}
                </span>
                <span className="w-1 h-1 rounded-full bg-teal/40" />
                <span className="font-ibm text-[11px] text-text-secondary">
                  {post.readTime}
                </span>
              </div>

              <h1 className="font-dm text-[32px] md:text-[42px] lg:text-[48px] font-semibold text-text-primary leading-[1.1] tracking-tight">
                {post.title}
              </h1>

              <p className="font-lora text-[17px] md:text-[18px] text-text-secondary leading-relaxed mt-5 italic">
                {post.excerpt}
              </p>

              <div className="w-16 h-px bg-teal/30 mt-8" />
            </header>

            {/* Cover gradient */}
            <div
              className={`h-48 md:h-64 bg-gradient-to-br ${post.coverColor} rounded-xl mb-10 md:mb-14 relative overflow-hidden border border-[rgba(13,183,187,0.1)]`}
            >
              <div className="absolute inset-0 grid-overlay opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-ibm text-[11px] text-teal/40 uppercase tracking-[0.3em]">
                  Featured Image
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="article-body">
              {renderMarkdownContent(post.content)}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:pt-24">
            <div className="lg:sticky lg:top-28">
              <h3 className="font-dm text-[13px] font-medium text-text-primary uppercase tracking-wider mb-5">
                Related Articles
              </h3>
              <div className="flex flex-col gap-4">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group grid-panel p-4 card-glow"
                  >
                    <span className="font-ibm text-[10px] text-teal/60 uppercase tracking-[0.15em]">
                      {related.tag}
                    </span>
                    <h4 className="font-dm text-[14px] font-medium text-text-primary mt-1.5 leading-snug group-hover:text-teal transition-colors duration-300">
                      {related.title}
                    </h4>
                    <span className="font-ibm text-[11px] text-text-secondary mt-2 block">
                      {formatDate(related.date)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
