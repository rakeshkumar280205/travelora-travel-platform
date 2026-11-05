"use client";

import Link from "next/link";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type BlogRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED";
  authorName?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
  versionCount?: number;
};

export function BlogList({
  posts,
  canMutate,
}: {
  posts: BlogRow[];
  canMutate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const post of posts) {
      if (post.category) set.add(post.category);
    }
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const searchTarget = `${post.title} ${post.slug} ${post.category} ${post.excerpt}`.toLowerCase();
      const matchesQuery = searchTarget.includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || post.status === status;
      const matchesCategory = category === "ALL" || post.category.toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [posts, query, status, category]);

  async function deletePost(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("The article could not be deleted.");
        setDeletingId(null);
        return;
      }
      window.location.reload();
    } catch {
      setMessage("A network error occurred while deleting the article.");
      setDeletingId(null);
    }
  }

  return (
    <section className="border border-charcoal/10 bg-white" aria-labelledby="blog-list-heading">
      <h2 id="blog-list-heading" className="sr-only">Article list</h2>

      <div className="flex flex-col gap-4 border-b border-charcoal/10 p-5 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor="blog-admin-search" className="sr-only">Search articles</label>
          <Search size={17} className="absolute left-4 top-3.5 text-charcoal/40" aria-hidden="true" />
          <input
            id="blog-admin-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, slug, category or excerpt..."
            className="w-full border border-charcoal/15 bg-ivory py-3 pl-11 pr-4 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div>
            <label htmlFor="blog-admin-status-filter" className="sr-only">Filter by status</label>
            <select
              id="blog-admin-status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="w-full border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40 sm:w-40"
            >
              <option value="ALL">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div>
            <label htmlFor="blog-admin-category-filter" className="sr-only">Filter by category</label>
            <select
              id="blog-admin-category-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40 sm:w-44"
            >
              <option value="ALL">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800">
          {message}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="divide-y divide-charcoal/10">
          {filtered.map((post) => (
            <article
              id={post.id}
              key={post.id}
              className="flex flex-col gap-4 px-5 py-6 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-medium text-forest">
                    {post.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${post.status === "PUBLISHED"
                        ? "bg-forest/10 text-forest"
                        : "bg-gold/20 text-deep-green"
                      }`}
                  >
                    {post.status.toLowerCase()}
                  </span>
                  {post.versionCount !== undefined && post.versionCount > 0 && (
                    <span className="text-[11px] text-charcoal/50">
                      v{post.versionCount}
                    </span>
                  )}
                </div>

                <h3 className="mt-2 truncate font-medium text-forest text-base sm:text-lg">
                  {post.title}
                </h3>
                <p className="mt-1 text-xs text-charcoal/50">
                  /{post.slug} · By {post.authorName ?? "Travelora Editorial"}
                </p>
                <p className="mt-2 line-clamp-1 text-sm text-charcoal/70">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                <span className="text-xs text-charcoal/50">
                  {post.status === "PUBLISHED" && post.publishedAt
                    ? `Published ${formatDate(post.publishedAt)}`
                    : `Updated ${formatDate(post.updatedAt)}`}
                </span>

                <Link
                  href={`/admin/blog/${post.id}/preview`}
                  aria-label={`Preview ${post.title}`}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <Eye size={15} aria-hidden="true" /> Preview
                </Link>

                {canMutate && (
                  <>
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      aria-label={`Edit ${post.title}`}
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
                    >
                      <Pencil size={15} aria-hidden="true" /> Edit
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === post.id}
                      onClick={() => deletePost(post.id, post.title)}
                      aria-label={`Delete ${post.title}`}
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium text-red-700 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {deletingId === post.id ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <p className="font-display text-2xl text-forest">
            {posts.length === 0 ? "No articles yet" : "No matching articles"}
          </p>
          <p className="mt-3 text-sm text-charcoal/60">
            {posts.length === 0
              ? "Draft your first journal article to share destination insights."
              : "Try adjusting your search terms or filters."}
          </p>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
