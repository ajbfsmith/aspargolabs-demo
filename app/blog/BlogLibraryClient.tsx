"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "../data/blog-types";
import { formatBlogDate } from "@/lib/blog/format";

type BlogLibraryClientProps = {
  posts: BlogPost[];
};

export default function BlogLibraryClient({ posts }: BlogLibraryClientProps) {
  const [query, setQuery] = useState("");

  const filtered = posts.filter((post) => {
    const q = query.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tag.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid-surface min-h-screen pt-28 md:pt-36 pb-24">
      <div className="teal-glow fixed top-0 left-1/2 -translate-x-1/2 opacity-[0.04]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-16">
        <div className="text-center mb-12 md:mb-16">
          <span className="font-ibm text-[11px] text-teal/60 uppercase tracking-[0.25em] block mb-4">
            Accelerate Health
          </span>
          <h1 className="font-instrument text-[48px] md:text-[72px] lg:text-[88px] italic text-teal leading-[1]">
            From the Lab
          </h1>
          <p className="font-lora text-[16px] md:text-[18px] text-text-secondary mt-4 max-w-[480px] mx-auto leading-relaxed">
            Science, product insights, and the future of drug delivery.
          </p>
        </div>

        <div className="max-w-[520px] mx-auto mb-12 md:mb-16">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3.5 bg-[rgba(13,17,23,0.8)] border border-[rgba(13,183,187,0.18)] rounded-lg font-dm text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-teal/50 focus:shadow-[0_0_0_3px_rgba(13,183,187,0.08)] transition-all duration-300"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-lora text-[16px] text-text-secondary italic">
              No articles match your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="grid-panel card-glow h-full flex flex-col overflow-hidden">
                  <div
                    className={`h-40 md:h-48 bg-gradient-to-br ${post.coverColor} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 grid-overlay opacity-30" />
                    <div className="absolute bottom-3 left-4">
                      <span className="font-ibm text-[10px] text-teal/80 uppercase tracking-[0.2em] bg-void/50 backdrop-blur-sm px-2.5 py-1 rounded-md border border-teal/15">
                        {post.tag}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-ibm text-[11px] text-text-secondary">
                        {formatBlogDate(post.date)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-teal/40" />
                      <span className="font-ibm text-[11px] text-text-secondary">
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="font-dm text-[18px] md:text-[20px] font-semibold text-text-primary leading-snug mb-3 group-hover:text-teal transition-colors duration-300">
                      {post.title}
                    </h2>

                    <p className="font-lora text-[14px] text-text-secondary leading-[1.7] line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[rgba(13,183,187,0.08)]">
                      <span className="font-dm text-[13px] text-teal/70 group-hover:text-teal transition-colors duration-300">
                        Read article &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
