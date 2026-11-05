import { z } from "zod";

const dangerousPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /<input\b[^>]*>/gi,
  /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
  /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /\bon\w+\s*=/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
];

export function hasUnsafeHtml(content: string): boolean {
  return dangerousPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(content);
  });
}

export function sanitizeBlogContent(content: string): string {
  let sanitized = content;
  // Neutralize dangerous schemes in markdown links or images first
  sanitized = sanitized.replace(
    /\[([^\]]*)\]\(\s*(?:javascript|vbscript|data)\s*:[^\)]*\)/gi,
    "[$1](#)"
  );
  sanitized = sanitized.replace(
    /!\[([^\]]*)\]\(\s*(?:javascript|vbscript|data)\s*:[^\)]*\)/gi,
    ""
  );
  for (const pattern of dangerousPatterns) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, "");
  }
  return sanitized;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const safeContentSchema = z
  .string()
  .min(20, "Content must be at least 20 characters long.")
  .max(100000, "Content exceeds maximum length.")
  .refine((value) => !hasUnsafeHtml(value), {
    message: "Unsafe content detected: scripts, iframes, inline event handlers and unsafe URI schemes are strictly prohibited.",
  });

export const blogPostCreateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200, "Title is too long."),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .max(120, "Slug is too long.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers and hyphens only."),
  excerpt: z.string().trim().min(10, "Excerpt must be at least 10 characters.").max(600, "Excerpt is too long."),
  content: safeContentSchema,
  category: z.string().trim().min(2, "Category must be at least 2 characters.").max(50, "Category is too long."),
  tags: z.array(z.string().trim().min(1)).default([]),
  featuredImage: z.string().url("Featured image must be a valid URL.").or(z.string().startsWith("/")).optional().nullable(),
  imageAlt: z.string().trim().max(200).optional().nullable(),
  relatedPackageId: z.string().trim().min(1).optional().nullable(),
  seoTitle: z.string().trim().max(100).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const blogPostListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED"]).default("ALL"),
  category: z.string().trim().optional(),
  tag: z.string().trim().optional(),
});

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;
export type BlogPostListQuery = z.infer<typeof blogPostListQuerySchema>;
