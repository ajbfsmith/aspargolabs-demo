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
      title: "Published date",
      type: "date",
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
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "tag",
    },
  },
});
