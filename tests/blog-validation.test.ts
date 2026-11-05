import { describe, expect, it } from "vitest";
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  hasUnsafeHtml,
  slugify,
} from "@/lib/validation/blog-schemas";

const validPost = {
  title: "The Heritage Trails of Chettinad",
  slug: "heritage-trails-of-chettinad",
  excerpt:
    "An architectural journey through the palatial mansions, tile crafts, and fragrant culinary traditions of Chettinad.",
  content:
    "## Mansions of Stone and Teak\n\nChettinad is renowned for its expansive mansions featuring Burma teak pillars and Athangudi handmade tiles.\n\n- Karaikudi\n- Kanadukathan\n- Kottaiyur",
  category: "Heritage & Architecture",
  tags: ["Chettinad", "Architecture", "Tamil Nadu", "Culinary"],
  featuredImage: "https://images.unsplash.com/photo-1548013146-72479768bada",
  imageAlt: "Intricately carved wooden pillars in a traditional Chettinad courtyard",
  seoTitle: "Chettinad Heritage Guide | Travelora Journal",
  seoDescription:
    "Explore the stately mansions and culinary secrets of Chettinad with Travelora's architectural dispatch.",
};

describe("blog validation schema", () => {
  it("accepts valid blog post creation input", () => {
    const result = blogPostCreateSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it("validates slug constraints strictly", () => {
    // Valid slugs
    expect(
      blogPostCreateSchema.safeParse({ ...validPost, slug: "valid-slug-123" }).success
    ).toBe(true);

    // Invalid: uppercase letters
    expect(
      blogPostCreateSchema.safeParse({ ...validPost, slug: "Invalid-Slug" }).success
    ).toBe(false);

    // Invalid: spaces or special characters
    expect(
      blogPostCreateSchema.safeParse({ ...validPost, slug: "invalid slug!" }).success
    ).toBe(false);

    // Invalid: leading or trailing hyphens
    expect(
      blogPostCreateSchema.safeParse({ ...validPost, slug: "-invalid-slug-" }).success
    ).toBe(false);

    // Invalid: too short
    expect(
      blogPostCreateSchema.safeParse({ ...validPost, slug: "ab" }).success
    ).toBe(false);
  });

  it("rejects stored XSS payloads in blog content", () => {
    const xssPayloads = [
      "<script>alert('xss')</script>",
      "<iframe src='evil.com'></iframe>",
      "<img src=x onerror='alert(1)' />",
      "<svg onload='alert(1)'></svg>",
      "<a href='javascript:void(0)'>Click me</a>",
      "<style>body { display: none; }</style>",
      "<form action='https://phish.com'><input type='password' /></form>",
    ];

    for (const payload of xssPayloads) {
      expect(hasUnsafeHtml(payload)).toBe(true);

      const parseResult = blogPostCreateSchema.safeParse({
        ...validPost,
        content: `Normal paragraph text here.\n\n${payload}\n\nMore safe text following.`,
      });
      expect(parseResult.success).toBe(false);
    }
  });

  it("enforces minimum content and title lengths", () => {
    expect(
      blogPostCreateSchema.safeParse({ ...validPost, title: "ab" }).success
    ).toBe(false);

    expect(
      blogPostCreateSchema.safeParse({
        ...validPost,
        content: "Too short",
      }).success
    ).toBe(false);
  });

  it("allows partial updates via blogPostUpdateSchema", () => {
    const updateResult = blogPostUpdateSchema.safeParse({
      title: "Updated Title for Chettinad",
      status: "PUBLISHED",
    });
    expect(updateResult.success).toBe(true);
  });

  it("slugify utility generates valid URL slugs", () => {
    expect(slugify("A Guide to Western Ghats: 2026 Edition!")).toBe(
      "a-guide-to-western-ghats-2026-edition"
    );
    expect(slugify("   Monsoon Retreats & Waterfalls   ")).toBe(
      "monsoon-retreats-waterfalls"
    );
    expect(slugify("Kerala's Backwaters -- Houseboats & Culture")).toBe(
      "keralas-backwaters-houseboats-culture"
    );
  });
});
