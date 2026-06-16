import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Accelerate Health",
  description:
    "Accelerate Health is an informational resource about health, science, and wellness.",
};

const topics = [
  {
    title: "Science & Pharmacology",
    description:
      "How treatments work in the body, why delivery methods matter, and what research means in practice.",
  },
  {
    title: "Wellness & Lived Experience",
    description:
      "The everyday side of health: routine, confidence, and the decisions that shape how people feel.",
  },
  {
    title: "Product & Innovation",
    description:
      "New formulations, smarter dosing, and the engineering behind care designed for real life.",
  },
  {
    title: "Industry Perspectives",
    description:
      "Where healthcare is headed and the conversations worth having beyond the headline.",
  },
];

export default function AboutPage() {
  return (
    <div className="grid-surface min-h-screen pt-28 md:pt-36 pb-24">
      <div className="teal-glow fixed top-0 left-1/2 -translate-x-1/2 opacity-[0.04]" />

      <div className="relative z-10 max-w-[720px] mx-auto px-4 md:px-16">
        <header className="text-center mb-12 md:mb-16">
          <span className="font-ibm text-[11px] text-teal/60 uppercase tracking-[0.25em] block mb-4">
            Accelerate Health
          </span>
          <h1 className="font-instrument text-[48px] md:text-[72px] italic text-teal leading-none">
            About Us
          </h1>
          <p className="font-lora text-[16px] md:text-[17px] text-text-secondary mt-5 leading-relaxed">
            Clear writing on health, science, and wellness for curious readers.
          </p>
        </header>

        <section className="grid-panel card-glow p-8 md:p-10 mb-10">
          <span className="font-ibm text-[10px] text-teal/80 uppercase tracking-[0.2em] bg-teal/8 px-2.5 py-1 rounded-md border border-teal/15 inline-block mb-6">
            What we are
          </span>
          <p className="font-lora text-[16px] md:text-[17px] text-text-secondary leading-[1.85] mb-5">
            <strong className="text-text-primary font-medium">
              Accelerate Health
            </strong>{" "}
            is an informational site. We publish thoughtful articles on science,
            wellness, and the ideas shaping modern health, written to be
            accessible without dumbing things down.
          </p>
          <p className="font-lora text-[16px] md:text-[17px] text-text-secondary leading-[1.85]">
            Whether you are curious about how a treatment works or what shifts in
            care might mean for everyday life, this is a place to read, learn,
            and think it through at your own pace.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-dm text-[22px] md:text-[26px] font-semibold text-text-primary mb-3">
            What we write about
          </h2>
          <p className="font-lora text-[15px] md:text-[16px] text-text-secondary leading-[1.85] mb-6">
            Our articles span a few recurring themes. Health is more interesting
            when you understand it, and these are the areas we keep coming back
            to.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <article
                key={topic.title}
                className="grid-panel card-glow p-5 md:p-6"
              >
                <h3 className="font-dm text-[16px] font-semibold text-text-primary leading-snug mb-2">
                  {topic.title}
                </h3>
                <p className="font-lora text-[14px] text-text-secondary leading-[1.75]">
                  {topic.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <blockquote className="border-l-2 border-teal/40 pl-6 md:pl-8 py-1">
            <p className="font-lora text-[17px] md:text-[19px] text-text-primary/85 italic leading-[1.8]">
              We believe good health writing respects your intelligence. It
              explains the &ldquo;why&rdquo; behind the headline and leaves room
              for you to form your own view.
            </p>
          </blockquote>
        </section>

        <section className="text-center">
          <p className="font-lora text-[15px] text-text-secondary leading-relaxed mb-6">
            For longer reads and deeper dives, visit our blog.
          </p>
          <Link
            href="/blog"
            className="font-dm text-[14px] text-teal/80 hover:text-teal transition-colors duration-300 inline-flex items-center gap-2 group"
          >
            Go to the blog
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform duration-300"
            />
          </Link>
        </section>
      </div>
    </div>
  );
}
