import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BlogCard } from "@/components/blog/blog-card";
import { getPublishedBlogPosts } from "@/server/services/blog-service";

export const metadata: Metadata = {
  title: "Journal | Travelora — Journeys Beyond Ordinary",
  description:
    "Dispatches, destination intelligence, and cultural perspectives curated by Travelora's private travel atelier.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Journal | Travelora",
    description:
      "Dispatches, destination intelligence, and cultural perspectives curated by Travelora.",
    url: "/blog",
    type: "website",
  },
};

export const instant = false;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  await connection();
  const { category, tag } = await searchParams;

  const [allPosts, filteredPosts] = await Promise.all([
    getPublishedBlogPosts(),
    getPublishedBlogPosts({ category, tag }),
  ]);

  const categories = Array.from(
    new Set(allPosts.map((post) => post.category).filter(Boolean))
  ).sort();

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      {/* Editorial Hero */}
      <section className="bg-forest px-6 pb-20 pt-36 text-white sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">
            The Travelora Journal
          </p>
          <h1 className="font-display mt-4 text-4xl sm:text-5xl lg:text-6xl text-ivory max-w-3xl leading-[1.15]">
            Stories & dispatches from the road less trodden.
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed font-light">
            Insights on heritage estates, culinary trails, seasonal wonders, and private sanctuaries across the Indian subcontinent.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16" id="journal-content">
        {/* Category Filter Pills */}
        <nav
          aria-label="Filter journal articles by category"
          className="flex flex-wrap items-center gap-2 border-b border-charcoal/10 pb-8"
        >
          <Link
            href="/blog"
            className={`rounded-full px-4 py-2 text-xs font-medium tracking-wide transition ${
              !category
                ? "bg-forest text-white shadow-sm"
                : "bg-white text-charcoal/70 hover:bg-forest/10 hover:text-forest border border-charcoal/10"
            }`}
          >
            All Dispatches ({allPosts.length})
          </Link>

          {categories.map((cat) => {
            const isSelected = category?.toLowerCase() === cat.toLowerCase();
            const count = allPosts.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
            return (
              <Link
                key={cat}
                href={`/blog?category=${encodeURIComponent(cat)}`}
                className={`rounded-full px-4 py-2 text-xs font-medium tracking-wide transition ${
                  isSelected
                    ? "bg-forest text-white shadow-sm"
                    : "bg-white text-charcoal/70 hover:bg-forest/10 hover:text-forest border border-charcoal/10"
                }`}
              >
                {cat} ({count})
              </Link>
            );
          })}
        </nav>

        {/* Article Grid or Empty State */}
        {filteredPosts.length > 0 ? (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post.id}
                post={{
                  id: post.id,
                  slug: post.slug,
                  title: post.title,
                  excerpt: post.excerpt,
                  category: post.category,
                  featuredImage: post.featuredImage,
                  imageAlt: post.imageAlt,
                  publishedAt: post.publishedAt,
                  author: post.author,
                  content: post.content,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="my-16 rounded-2xl border border-charcoal/10 bg-white p-12 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              Journal Archive
            </p>
            <h2 className="font-display mt-3 text-2xl text-forest sm:text-3xl">
              {category
                ? `No dispatches found in "${category}"`
                : "No published dispatches yet"}
            </h2>
            <p className="mt-3 text-sm text-charcoal/60 max-w-md mx-auto">
              {category
                ? "We haven't published stories in this category yet. Explore other topics or browse all dispatches."
                : "Our writers and expedition curators are preparing fresh travel narratives. Please check back soon."}
            </p>
            {category && (
              <div className="mt-6">
                <Link
                  href="/blog"
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-6 text-xs font-medium text-white hover:bg-forest/90"
                >
                  View all dispatches
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
