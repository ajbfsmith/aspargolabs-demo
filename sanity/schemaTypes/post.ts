import { defineField, defineType } from "sanity";

export const postType = defineType({
  name: "post",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Publication Date & Time",
      type: "datetime",
      options: {
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm",
        timeStep: 15,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readTime",
      title: "Read time",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverColor",
      title: "Cover gradient classes",
      type: "string",
      description: "Tailwind gradient classes, e.g. from-teal/20 to-void",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Content (markdown)",
      type: "text",
      rows: 20,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      description: "Overrides the page title tag when set",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "focusKeyword",
      title: "Focus Keyword",
      type: "string",
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "noindex",
      title: "Noindex",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "tier",
      title: "Content Tier",
      type: "number",
      options: { list: [1, 2, 3, 4] },
      validation: (rule) => rule.min(1).max(4),
    }),
    defineField({
      name: "isPillar",
      title: "Is Pillar Page",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "pillar",
      title: "Pillar Page",
      type: "reference",
      to: [{ type: "post" }],
      description: "Link cluster posts back to their pillar page",
    }),
    defineField({
      name: "clusterId",
      title: "Cluster ID",
      type: "string",
    }),
    defineField({
      name: "clusterTitle",
      title: "Cluster Title",
      type: "string",
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "medicalReviewer",
      title: "Medical Reviewer",
      type: "reference",
      to: [{ type: "medicalReviewer" }],
    }),
    defineField({
      name: "lastReviewedAt",
      title: "Last Reviewed At",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "tag",
      date: "publishedAt",
    },
    prepare({ title, subtitle, date }) {
      return {
        title,
        subtitle: [subtitle, date].filter(Boolean).join(" · "),
      };
    },
  },
});
