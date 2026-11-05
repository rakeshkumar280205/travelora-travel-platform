import "server-only";

import type { Prisma } from "@prisma/client";
import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  sanitizeBlogContent,
  type BlogPostCreateInput,
  type BlogPostUpdateInput,
} from "@/lib/validation/blog-schemas";
import {
  createBlogPost,
  deleteBlogPost,
  findBlogPostById,
  findBlogPostBySlug,
  findPublishedBlogPostBySlug,
  getBlogVersion,
  listAllBlogPosts,
  listBlogVersions,
  listPublishedBlogPosts,
  publishBlogPost,
  rollbackBlogPost,
  toBlogPostSnapshot,
  updateBlogPost,
  type BlogPostSnapshot,
} from "@/server/repositories/blog-repository";

export async function getPublishedBlogPosts(query?: {
  category?: string;
  tag?: string;
}) {
  try {
    return await listPublishedBlogPosts(query);
  } catch {
    return [];
  }
}

export async function getPublishedBlogPostBySlug(slug: string) {
  try {
    return await findPublishedBlogPostBySlug(slug);
  } catch {
    return null;
  }
}

export async function getAdminBlogPosts(query?: {
  search?: string;
  status?: "ALL" | "DRAFT" | "PUBLISHED";
  category?: string;
}) {
  return listAllBlogPosts(query);
}

export async function getAdminBlogPostById(id: string) {
  const post = await findBlogPostById(id);
  if (!post) throw new Error("BLOG_POST_NOT_FOUND");
  return post;
}

export async function addBlogPost(
  input: BlogPostCreateInput,
  authorId?: string | null
) {
  const validated = blogPostCreateSchema.parse(input);

  // Check slug uniqueness
  const existingWithSlug = await findBlogPostBySlug(validated.slug);
  if (existingWithSlug) {
    throw new Error("SLUG_ALREADY_EXISTS");
  }

  const sanitizedContent = sanitizeBlogContent(validated.content);

  const createData: Prisma.BlogPostCreateInput = {
    title: validated.title,
    slug: validated.slug,
    excerpt: validated.excerpt,
    content: sanitizedContent,
    category: validated.category,
    tags: validated.tags ?? [],
    featuredImage: validated.featuredImage ?? null,
    imageAlt: validated.imageAlt ?? null,
    seoTitle: validated.seoTitle ?? null,
    seoDescription: validated.seoDescription ?? null,
    status: "DRAFT",
    ...(authorId ? { author: { connect: { id: authorId } } } : {}),
    ...(validated.relatedPackageId
      ? { relatedPackage: { connect: { id: validated.relatedPackageId } } }
      : {}),
  };

  return createBlogPost(createData);
}

export async function editBlogPost(id: string, input: BlogPostUpdateInput) {
  const validated = blogPostUpdateSchema.parse(input);
  const existing = await findBlogPostById(id);
  if (!existing) throw new Error("BLOG_POST_NOT_FOUND");

  if (validated.slug && validated.slug !== existing.slug) {
    const slugOwner = await findBlogPostBySlug(validated.slug);
    if (slugOwner && slugOwner.id !== id) {
      throw new Error("SLUG_ALREADY_EXISTS");
    }
  }

  const updateData: Prisma.BlogPostUpdateInput = {};

  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.slug !== undefined) updateData.slug = validated.slug;
  if (validated.excerpt !== undefined) updateData.excerpt = validated.excerpt;
  if (validated.content !== undefined) {
    updateData.content = sanitizeBlogContent(validated.content);
  }
  if (validated.category !== undefined) updateData.category = validated.category;
  if (validated.tags !== undefined) updateData.tags = validated.tags;
  if (validated.featuredImage !== undefined) {
    updateData.featuredImage = validated.featuredImage;
  }
  if (validated.imageAlt !== undefined) updateData.imageAlt = validated.imageAlt;
  if (validated.seoTitle !== undefined) updateData.seoTitle = validated.seoTitle;
  if (validated.seoDescription !== undefined) {
    updateData.seoDescription = validated.seoDescription;
  }
  if (validated.status !== undefined) {
    updateData.status = validated.status;
  }
  if (validated.relatedPackageId !== undefined) {
    if (validated.relatedPackageId) {
      updateData.relatedPackage = { connect: { id: validated.relatedPackageId } };
    } else {
      updateData.relatedPackage = { disconnect: true };
    }
  }

  return updateBlogPost(id, updateData);
}

export async function removeBlogPost(id: string) {
  const existing = await findBlogPostById(id);
  if (!existing) throw new Error("BLOG_POST_NOT_FOUND");
  return deleteBlogPost(id);
}

export async function publishBlogPostRecord(
  id: string,
  createdBy: string | null
) {
  const post = await findBlogPostById(id);
  if (!post) throw new Error("BLOG_POST_NOT_FOUND");

  // Validate publish readiness
  if (!post.title || !post.slug || !post.excerpt || !post.content || !post.category) {
    throw new Error("POST_NOT_PUBLISHABLE");
  }

  const snapshot = toBlogPostSnapshot(post);
  return publishBlogPost(id, createdBy, snapshot);
}

export async function getBlogPostVersionHistory(id: string) {
  const post = await findBlogPostById(id);
  if (!post) throw new Error("BLOG_POST_NOT_FOUND");
  return listBlogVersions(id);
}

export async function rollbackBlogPostVersion(
  id: string,
  versionId: string,
  createdBy: string | null
) {
  const version = await getBlogVersion(id, versionId);
  if (!version) throw new Error("VERSION_NOT_FOUND");

  const snapshot = version.snapshot as BlogPostSnapshot;
  return rollbackBlogPost(id, createdBy, snapshot);
}
