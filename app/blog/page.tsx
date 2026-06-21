import type { Metadata } from "next";
import { listBlogPostsFromCms } from "@/lib/blog/repository";
import { buildBlogIndexJsonLd } from "@/lib/blog/seo";
import BlogLibraryClient from "./BlogLibraryClient";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "From the Lab | Accelerate Health Blog",
  description:
    "Science, product insights, and the future of drug delivery from Accelerate Health.",
  openGraph: {
    title: "From the Lab | Accelerate Health Blog",
    description:
      "Science, product insights, and the future of drug delivery from Accelerate Health.",
    type: "website",
  },
};

export default async function BlogLibraryPage() {
  const posts = await listBlogPostsFromCms();
  const jsonLd = buildBlogIndexJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogLibraryClient posts={posts} />
    </>
  );
}
