import { beforeEach, describe, expect, it, vi } from "vitest";

const { connection } = vi.hoisted(() => ({ connection: vi.fn() }));
const {
  addBlogPost,
  editBlogPost,
  getAdminBlogPostById,
  getAdminBlogPosts,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getStaffSession,
  hasStaffRole,
  publishBlogPostRecord,
} = vi.hoisted(() => ({
  addBlogPost: vi.fn(),
  editBlogPost: vi.fn(),
  getAdminBlogPostById: vi.fn(),
  getAdminBlogPosts: vi.fn(),
  getPublishedBlogPostBySlug: vi.fn(),
  getPublishedBlogPosts: vi.fn(),
  getStaffSession: vi.fn(),
  hasStaffRole: vi.fn(),
  publishBlogPostRecord: vi.fn(),
}));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/services/authorization", () => ({
  getStaffSession,
  hasStaffRole,
}));
vi.mock("@/server/services/blog-service", () => ({
  addBlogPost,
  editBlogPost,
  getAdminBlogPostById,
  getAdminBlogPosts,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  publishBlogPostRecord,
}));

import { GET as adminBlogGet, POST as adminBlogPost } from "@/app/api/admin/blog/route";
import { PATCH as adminBlogPatch } from "@/app/api/admin/blog/[id]/route";
import { POST as adminBlogPublish } from "@/app/api/admin/blog/[id]/publish/route";
import { GET as publicBlogGet } from "@/app/api/blog/route";
import { GET as publicBlogSlugGet } from "@/app/api/blog/[slug]/route";

const validArticle = {
  title: "Ancient Temples of Hampi",
  slug: "ancient-temples-of-hampi",
  excerpt: "The boulder-strewn ruins of the Vijayanagara Empire.",
  content:
    "## Vittala Temple\n\nThe musical pillars and iconic stone chariot stand as monumental feats of Dravidian craftsmanship.",
  category: "Heritage & Ruins",
  tags: ["Hampi", "Karnataka", "Ruins"],
};

describe("blog API routes authorization & visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Admin routes authorization", () => {
    it("returns 401 for admin blog GET if unauthenticated", async () => {
      hasStaffRole.mockResolvedValueOnce(null);
      const response = await adminBlogGet(new Request("http://localhost/api/admin/blog"));
      expect(response.status).toBe(401);
    });

    it("returns 200 for staff reading blog list", async () => {
      hasStaffRole.mockResolvedValueOnce({
        user: { id: "consultant-1", role: "CONSULTANT" },
      });
      getAdminBlogPosts.mockResolvedValueOnce([validArticle]);

      const response = await adminBlogGet(new Request("http://localhost/api/admin/blog"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveLength(1);
    });

    it("returns 403 when a CONSULTANT attempts to create a blog post", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "consultant-1", role: "CONSULTANT" },
      });

      const response = await adminBlogPost(
        new Request("http://localhost/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validArticle),
        })
      );

      expect(response.status).toBe(403);
      expect(addBlogPost).not.toHaveBeenCalled();
    });

    it("allows an EDITOR or ADMIN to create a blog post", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "editor-1", role: "EDITOR" },
      });
      addBlogPost.mockResolvedValueOnce({
        id: "post-hampi",
        ...validArticle,
        status: "DRAFT",
      });

      const response = await adminBlogPost(
        new Request("http://localhost/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validArticle),
        })
      );

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data.slug).toBe("ancient-temples-of-hampi");
    });

    it("returns 409 when slug conflict occurs on creation", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      });
      addBlogPost.mockRejectedValueOnce(new Error("SLUG_ALREADY_EXISTS"));

      const response = await adminBlogPost(
        new Request("http://localhost/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validArticle),
        })
      );

      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error.code).toBe("CONFLICT");
    });

    it("allows an EDITOR to update an existing blog post via PATCH", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "editor-1", role: "EDITOR" },
      });
      editBlogPost.mockResolvedValueOnce({
        id: "post-1",
        title: "Updated Hampi Title",
      });

      const response = await adminBlogPatch(
        new Request("http://localhost/api/admin/blog/post-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Updated Hampi Title" }),
        }),
        { params: Promise.resolve({ id: "post-1" }) }
      );

      expect(response.status).toBe(200);
      expect(editBlogPost).toHaveBeenCalledWith(
        "post-1",
        expect.objectContaining({ title: "Updated Hampi Title" })
      );
    });

    it("returns 403 when a CONSULTANT attempts to publish a blog post", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "consultant-1", role: "CONSULTANT" },
      });

      const response = await adminBlogPublish(
        new Request("http://localhost/api/admin/blog/post-1/publish", { method: "POST" }),
        { params: Promise.resolve({ id: "post-1" }) }
      );

      expect(response.status).toBe(403);
      expect(publishBlogPostRecord).not.toHaveBeenCalled();
    });
  });

  describe("Public routes visibility", () => {
    it("returns published posts list publicly", async () => {
      getPublishedBlogPosts.mockResolvedValueOnce([
        { id: "post-1", slug: "hampi", status: "PUBLISHED" },
      ]);

      const response = await publicBlogGet(new Request("http://localhost/api/blog"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveLength(1);
    });

    it("returns 404 for drafts or unpublished articles on public route", async () => {
      // Draft post without publishedVersion
      getPublishedBlogPostBySlug.mockResolvedValueOnce({
        id: "post-draft",
        slug: "draft-article",
        status: "DRAFT",
        publishedVersion: null,
      });

      const response = await publicBlogSlugGet(
        new Request("http://localhost/api/blog/draft-article"),
        { params: Promise.resolve({ slug: "draft-article" }) }
      );

      expect(response.status).toBe(404);
    });

    it("returns 200 for published articles on public route", async () => {
      getPublishedBlogPostBySlug.mockResolvedValueOnce({
        id: "post-published",
        slug: "ancient-temples-of-hampi",
        status: "PUBLISHED",
        publishedVersion: { id: "v-1" },
      });

      const response = await publicBlogSlugGet(
        new Request("http://localhost/api/blog/ancient-temples-of-hampi"),
        { params: Promise.resolve({ slug: "ancient-temples-of-hampi" }) }
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.slug).toBe("ancient-temples-of-hampi");
    });
  });
});
