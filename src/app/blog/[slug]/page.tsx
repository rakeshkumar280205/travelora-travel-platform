import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, Calendar, Clock, Compass, Tag, User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BlogContentRenderer } from "@/components/blog/blog-content-renderer";
import { getPublishedBlogPostBySlug } from "@/server/services/blog-service";

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post || post.status !== "PUBLISHED" || !post.publishedVersion) {
    return {
      title: "Story Not Found | Travelora Journal",
      description: "The requested travel dispatch could not be found.",
    };
  }

  const title = post.seoTitle || `${post.title} | Travelora Journal`;
  const description = post.seoDescription || post.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : ["Travelora Editorial"],
      images: post.featuredImage
        ? [
            {
              url: post.featuredImage,
              alt: post.imageAlt || post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post || post.status !== "PUBLISHED" || !post.publishedVersion) {
    notFound();
  }

  const readingTime = estimateReadingTime(post.content);
  const formattedPublishedAt = formatDate(post.publishedAt);

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      {/* Top Header / Breadcrumbs */}
      <section className="bg-forest px-6 pb-16 pt-32 text-white sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <nav
            aria-label="Breadcrumb navigation"
            className="flex items-center gap-2 text-xs text-white/60 mb-6"
          >
            <Link href="/" className="hover:text-gold transition">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog" className="hover:text-gold transition">
              Journal
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/80 line-clamp-1">{post.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-gold">
            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold hover:bg-gold/25 transition"
            >
              {post.category}
            </Link>
            <span className="flex items-center gap-1 text-white/70 font-sans tracking-normal">
              <Clock size={12} aria-hidden="true" /> {readingTime} min read
            </span>
            {formattedPublishedAt && (
              <span className="flex items-center gap-1 text-white/70 font-sans tracking-normal">
                <Calendar size={12} aria-hidden="true" /> {formattedPublishedAt}
              </span>
            )}
          </div>

          <h1 className="font-display mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-ivory leading-[1.18]">
            {post.title}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed font-serif italic border-l-2 border-gold pl-4 sm:pl-6">
            {post.excerpt}
          </p>

          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold font-medium">
              <User size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {post.author?.name || "Travelora Editorial"}
              </p>
              <p className="text-xs text-white/50">
                Staff Journalist & Destination Curator
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Article Container */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:px-16" id="article-body">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative mb-12 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-charcoal/5 shadow-md">
            <Image
              src={post.featuredImage}
              alt={post.imageAlt || post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="border-b border-charcoal/10 pb-12">
          <BlogContentRenderer content={post.content} />
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="py-8 border-b border-charcoal/10">
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={15} className="text-gold" aria-hidden="true" />
              <span className="text-xs font-medium text-charcoal/60 mr-1">
                Themes & Regions:
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-3 py-1 text-xs text-charcoal/70 border border-charcoal/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Package Cross-Link */}
        {post.relatedPackage && (
          <section
            aria-labelledby="featured-journey-heading"
            className="my-12 overflow-hidden rounded-2xl border border-forest/15 bg-white p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <Compass size={14} aria-hidden="true" />
              <span>Recommended Journey Pairing</span>
            </div>

            <h2
              id="featured-journey-heading"
              className="font-display mt-3 text-2xl sm:text-3xl text-forest"
            >
              {post.relatedPackage.title}
            </h2>

            <p className="mt-2 text-sm text-charcoal/70">
              Experience the landscapes, culture and bespoke lodges featured in this story.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-charcoal/60">
              <span>📍 {post.relatedPackage.destination}</span>
              <span>·</span>
              <span>⏳ {post.relatedPackage.durationDays} Days</span>
              <span>·</span>
              <span>🏨 {post.relatedPackage.hotelCategory}</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={`/packages/${post.relatedPackage.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-xs font-medium text-white hover:bg-forest/90 transition shadow-sm"
              >
                Explore journey itinerary <ArrowRight size={13} className="ml-1.5" aria-hidden="true" />
              </Link>
              <Link
                href={`/packages/${post.relatedPackage.slug}#enquire`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-forest/20 px-6 text-xs font-medium text-forest hover:bg-forest/5 transition"
              >
                Private enquiry
              </Link>
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-gold transition"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Return to all dispatches
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
