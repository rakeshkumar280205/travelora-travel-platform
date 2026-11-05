import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type BlogPostSnapshot = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  imageAlt: string | null;
  category: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string | null;
  relatedPackageId: string | null;
  publishedAt: string;
};

const blogPostInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  relatedPackage: {
    select: {
      id: true,
      slug: true,
      title: true,
      destination: true,
      durationDays: true,
      category: true,
      hotelCategory: true,
      seasonalPrices: {
        orderBy: { startDate: "asc" as const },
        take: 1,
      },
    },
  },
  publishedVersion: true,
};

export function toBlogPostSnapshot(postRecord: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string | null;
  imageAlt?: string | null;
  category: string;
  tags: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  authorId?: string | null;
  relatedPackageId?: string | null;
  publishedAt?: Date | string | null;
}): BlogPostSnapshot {
  return {
    slug: postRecord.slug,
    title: postRecord.title,
    excerpt: postRecord.excerpt,
    content: postRecord.content,
    featuredImage: postRecord.featuredImage ?? null,
    imageAlt: postRecord.imageAlt ?? null,
    category: postRecord.category,
    tags: postRecord.tags ?? [],
    seoTitle: postRecord.seoTitle ?? null,
    seoDescription: postRecord.seoDescription ?? null,
    authorId: postRecord.authorId ?? null,
    relatedPackageId: postRecord.relatedPackageId ?? null,
    publishedAt: postRecord.publishedAt
      ? new Date(postRecord.publishedAt).toISOString()
      : new Date().toISOString(),
  };
}

export async function listPublishedBlogPosts(query?: {
  category?: string;
  tag?: string;
}) {
  const where: Prisma.BlogPostWhereInput = {
    status: "PUBLISHED",
    publishedVersion: { isNot: null },
  };

  if (query?.category && query.category.trim() !== "") {
    where.category = {
      equals: query.category.trim(),
      mode: "insensitive",
    };
  }

  if (query?.tag && query.tag.trim() !== "") {
    where.tags = {
      has: query.tag.trim(),
    };
  }

  return prisma.blogPost.findMany({
    where,
    include: blogPostInclude,
    orderBy: { publishedAt: "desc" },
  });
}

export async function findPublishedBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedVersion: { isNot: null },
    },
    include: blogPostInclude,
  });

  return post;
}

export async function listAllBlogPosts(query?: {
  search?: string;
  status?: "ALL" | "DRAFT" | "PUBLISHED";
  category?: string;
}) {
  const where: Prisma.BlogPostWhereInput = {};

  if (query?.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query?.category && query.category.trim() !== "") {
    where.category = {
      equals: query.category.trim(),
      mode: "insensitive",
    };
  }

  if (query?.search && query.search.trim() !== "") {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { slug: { contains: term, mode: "insensitive" } },
      { excerpt: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
    ];
  }

  return prisma.blogPost.findMany({
    where,
    include: {
      ...blogPostInclude,
      _count: {
        select: { versions: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findBlogPostById(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    include: {
      ...blogPostInclude,
      versions: {
        select: {
          id: true,
          versionNumber: true,
          createdBy: true,
          createdAt: true,
        },
        orderBy: { versionNumber: "desc" },
      },
    },
  });
}

export async function findBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: blogPostInclude,
  });
}

export async function createBlogPost(
  data: Parameters<typeof prisma.blogPost.create>[0]["data"]
) {
  return prisma.blogPost.create({
    data,
    include: blogPostInclude,
  });
}

export async function updateBlogPost(
  id: string,
  data: Parameters<typeof prisma.blogPost.update>[0]["data"]
) {
  return prisma.blogPost.update({
    where: { id },
    data,
    include: blogPostInclude,
  });
}

export async function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({
    where: { id },
  });
}

export async function publishBlogPost(
  id: string,
  createdBy: string | null,
  snapshot: BlogPostSnapshot
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const post = await transaction.blogPost.findUnique({ where: { id } });
          if (!post) throw new Error("BLOG_POST_NOT_FOUND");

          const latest = await transaction.blogPostVersion.aggregate({
            where: { postId: id },
            _max: { versionNumber: true },
          });

          const version = await transaction.blogPostVersion.create({
            data: {
              postId: id,
              versionNumber: (latest._max.versionNumber ?? 0) + 1,
              snapshot,
              createdBy,
            },
          });

          await transaction.blogPost.update({
            where: { id },
            data: {
              status: "PUBLISHED",
              publishedAt: post.publishedAt ?? new Date(snapshot.publishedAt),
              publishedVersionId: version.id,
            },
          });

          return version;
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("PUBLISH_RETRY_EXHAUSTED");
}

export async function rollbackBlogPost(
  id: string,
  createdBy: string | null,
  snapshot: BlogPostSnapshot
) {
  return prisma.$transaction(
    async (transaction) => {
      const post = await transaction.blogPost.findUnique({ where: { id } });
      if (!post) throw new Error("BLOG_POST_NOT_FOUND");

      const latest = await transaction.blogPostVersion.aggregate({
        where: { postId: id },
        _max: { versionNumber: true },
      });

      const version = await transaction.blogPostVersion.create({
        data: {
          postId: id,
          versionNumber: (latest._max.versionNumber ?? 0) + 1,
          snapshot,
          createdBy,
        },
      });

      await transaction.blogPost.update({
        where: { id },
        data: {
          slug: snapshot.slug,
          title: snapshot.title,
          excerpt: snapshot.excerpt,
          content: snapshot.content,
          featuredImage: snapshot.featuredImage,
          imageAlt: snapshot.imageAlt,
          category: snapshot.category,
          tags: snapshot.tags,
          seoTitle: snapshot.seoTitle,
          seoDescription: snapshot.seoDescription,
          relatedPackageId: snapshot.relatedPackageId,
          status: "PUBLISHED",
          publishedVersionId: version.id,
        },
      });

      return version;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function listBlogVersions(postId: string) {
  return prisma.blogPostVersion.findMany({
    where: { postId },
    select: {
      id: true,
      versionNumber: true,
      createdAt: true,
      createdBy: true,
      post: {
        select: {
          publishedVersionId: true,
        },
      },
    },
    orderBy: { versionNumber: "desc" },
  });
}

export async function getBlogVersion(postId: string, versionId: string) {
  return prisma.blogPostVersion.findFirst({
    where: { id: versionId, postId },
  });
}
