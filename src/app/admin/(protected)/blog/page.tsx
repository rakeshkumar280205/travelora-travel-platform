import Link from "next/link";
import { getStaffSession } from "@/server/services/authorization";
import { getAdminBlogPosts } from "@/server/services/blog-service";
import { BlogList } from "@/components/admin/blog-list";

export const instant = false;

export default async function AdminBlogPage() {
  const [posts, session] = await Promise.all([
    getAdminBlogPosts(),
    getStaffSession(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Editorial & Journal
          </p>
          <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">
            Journal Articles
          </h1>
          <p className="mt-4 text-sm leading-7 text-charcoal/60">
            Publish travel dispatches, culture guides and destination intelligence.
          </p>
        </div>

        {session && session.user.role !== "CONSULTANT" && (
          <Link
            href="/admin/blog/new"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-deep-green hover:bg-forest hover:text-white"
          >
            Draft new article
          </Link>
        )}
      </header>

      <BlogList
        posts={posts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          category: post.category,
          excerpt: post.excerpt,
          status: post.status,
          authorName: post.author?.name ?? null,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          updatedAt: post.updatedAt.toISOString(),
          versionCount: post._count?.versions ?? 0,
        }))}
        canMutate={session?.user.role !== "CONSULTANT"}
      />
    </div>
  );
}
