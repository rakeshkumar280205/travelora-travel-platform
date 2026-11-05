import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createBlogPost,
  findBlogPostById,
  findBlogPostBySlug,
  findPublishedBlogPostBySlug,
  getBlogVersion,
  listAllBlogPosts,
  listPublishedBlogPosts,
  publishBlogPost,
  rollbackBlogPost,
} = vi.hoisted(() => ({
  createBlogPost: vi.fn(),
  findBlogPostById: vi.fn(),
  findBlogPostBySlug: vi.fn(),
  findPublishedBlogPostBySlug: vi.fn(),
  getBlogVersion: vi.fn(),
  listAllBlogPosts: vi.fn(),
  listPublishedBlogPosts: vi.fn(),
  publishBlogPost: vi.fn(),
  rollbackBlogPost: vi.fn(),
}));

vi.mock("@/server/repositories/blog-repository", () => ({
  createBlogPost,
  deleteBlogPost: vi.fn(),
  findBlogPostById,
  findBlogPostBySlug,
  findPublishedBlogPostBySlug,
  getBlogVersion,
  listAllBlogPosts,
  listBlogVersions: vi.fn(),
  listPublishedBlogPosts,
  publishBlogPost,
  rollbackBlogPost,
  toBlogPostSnapshot: vi.fn((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    tags: post.tags ?? [],
    publishedAt: "2026-11-05T00:00:00.000Z",
  })),
  updateBlogPost: vi.fn((id, data) => ({ id, ...data })),
}));

import {
  addBlogPost,
  editBlogPost,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  publishBlogPostRecord,
  rollbackBlogPostVersion,
} from "@/server/services/blog-service";

const samplePost = {
  id: "blog-1",
  slug: "wildlife-of-kabini",
  title: "The Elusive Leopards of Kabini",
  excerpt: "Tracking big cats through the riverine forests of Nagarhole.",
  content:
    "## Kabini River Forest\n\nMorning boat safaris along the Kabini reservoir offer glimpses of herds.",
  category: "Wildlife & Nature",
  tags: ["Kabini", "Karnataka", "Safaris"],
  featuredImage: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d",
  imageAlt: "A leopard perched upon a teak tree branch",
  status: "DRAFT" as const,
  publishedAt: null,
  publishedVersionId: null,
  authorId: "user-editor-1",
  relatedPackageId: "pkg-kabini-safari",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("blog service operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents creating a post with a duplicate slug", async () => {
    findBlogPostBySlug.mockResolvedValueOnce(samplePost);

    await expect(
      addBlogPost({
        title: samplePost.title,
        slug: samplePost.slug,
        excerpt: samplePost.excerpt,
        content: samplePost.content,
        category: samplePost.category,
        tags: samplePost.tags,
      })
    ).rejects.toThrow("SLUG_ALREADY_EXISTS");

    expect(createBlogPost).not.toHaveBeenCalled();
  });

  it("creates a draft post with author attribution and related package", async () => {
    findBlogPostBySlug.mockResolvedValueOnce(null);
    createBlogPost.mockResolvedValueOnce({
      ...samplePost,
      id: "new-post-1",
    });

    const created = await addBlogPost(
      {
        title: samplePost.title,
        slug: samplePost.slug,
        excerpt: samplePost.excerpt,
        content: samplePost.content,
        category: samplePost.category,
        tags: samplePost.tags,
        relatedPackageId: "pkg-kabini-safari",
      },
      "user-editor-1"
    );

    expect(created.id).toBe("new-post-1");
    expect(createBlogPost).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "wildlife-of-kabini",
        status: "DRAFT",
        author: { connect: { id: "user-editor-1" } },
        relatedPackage: { connect: { id: "pkg-kabini-safari" } },
      })
    );
  });

  it("prevents changing slug to another existing post's slug on edit", async () => {
    findBlogPostById.mockResolvedValueOnce(samplePost);
    findBlogPostBySlug.mockResolvedValueOnce({
      id: "another-post-2",
      slug: "taken-slug",
    });

    await expect(
      editBlogPost("blog-1", {
        slug: "taken-slug",
      })
    ).rejects.toThrow("SLUG_ALREADY_EXISTS");
  });

  it("publishes post and generates version snapshot", async () => {
    findBlogPostById.mockResolvedValueOnce(samplePost);
    publishBlogPost.mockResolvedValueOnce({
      id: "v-1",
      versionNumber: 1,
    });

    const result = await publishBlogPostRecord("blog-1", "user-editor-1");

    expect(result.versionNumber).toBe(1);
    expect(publishBlogPost).toHaveBeenCalledWith(
      "blog-1",
      "user-editor-1",
      expect.objectContaining({
        slug: "wildlife-of-kabini",
        title: "The Elusive Leopards of Kabini",
      })
    );
  });

  it("rolls back to a version snapshot", async () => {
    getBlogVersion.mockResolvedValueOnce({
      id: "v-1",
      versionNumber: 1,
      snapshot: {
        slug: "wildlife-of-kabini-v1",
        title: "Kabini Safaris Edition 1",
        excerpt: "Old excerpt",
        content: "## Old Content",
        category: "Wildlife",
        tags: [],
        featuredImage: null,
        imageAlt: null,
        seoTitle: null,
        seoDescription: null,
        authorId: null,
        relatedPackageId: null,
        publishedAt: "2026-10-01T00:00:00.000Z",
      },
    });

    rollbackBlogPost.mockResolvedValueOnce({
      id: "v-2",
      versionNumber: 2,
    });

    const restored = await rollbackBlogPostVersion("blog-1", "v-1", "admin-1");
    expect(restored.versionNumber).toBe(2);
    expect(rollbackBlogPost).toHaveBeenCalledWith(
      "blog-1",
      "admin-1",
      expect.objectContaining({
        slug: "wildlife-of-kabini-v1",
        title: "Kabini Safaris Edition 1",
      })
    );
  });

  it("filters public requests for published posts only", async () => {
    listPublishedBlogPosts.mockResolvedValueOnce([samplePost]);
    const posts = await getPublishedBlogPosts({ category: "Wildlife & Nature" });
    expect(posts).toHaveLength(1);
    expect(listPublishedBlogPosts).toHaveBeenCalledWith({
      category: "Wildlife & Nature",
    });

    findPublishedBlogPostBySlug.mockResolvedValueOnce(samplePost);
    const post = await getPublishedBlogPostBySlug("wildlife-of-kabini");
    expect(post?.slug).toBe("wildlife-of-kabini");
  });
});
