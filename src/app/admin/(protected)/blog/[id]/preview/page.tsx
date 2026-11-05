import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Clock, Tag, User } from "lucide-react";
import { BlogContentRenderer } from "@/components/blog/blog-content-renderer";
import { getAdminBlogPostById } from "@/server/services/blog-service";

export const instant = false;

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let post;
  try {
    post = await getAdminBlogPostById(id);
  } catch {
    notFound();
  }

  if (!post) notFound();

  const readingTime = estimateReadingTime(post.content);

  return (
    <div className="space-y-8">
      {/* Draft notice banner */}
      <div className="flex flex-col gap-2 rounded-lg border border-gold/40 bg-gold/15 p-4 text-sm text-deep-green sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong>STAFF PREVIEW MODE</strong> · Status:{" "}
          <span className="font-semibold">{post.status}</span>. Drafts are completely hidden from public visitors.
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/blog/${post.id}/edit`}
            className="text-xs font-semibold uppercase tracking-wider text-forest underline hover:text-gold"
          >
            Edit Article
          </Link>
          <Link
            href="/admin/blog"
            className="text-xs font-semibold uppercase tracking-wider text-forest underline hover:text-gold"
          >
            Back to Journal
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-charcoal/10 bg-white">
        {post.featuredImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-ivory">
            <Image
              src={post.featuredImage}
              alt={post.imageAlt || post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}

        <div className="p-6 sm:p-10 md:p-14">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-gold">
            <span className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-deep-green">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-charcoal/60 font-sans tracking-normal">
              <Clock size={13} aria-hidden="true" /> {readingTime} min read
            </span>
            <span className="flex items-center gap-1 text-charcoal/60 font-sans tracking-normal">
              <Calendar size={13} aria-hidden="true" /> Updated {post.updatedAt.toLocaleDateString("en-IN")}
            </span>
          </div>

          <h1 className="font-display mt-6 text-3xl sm:text-4xl md:text-5xl text-forest leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-lg text-charcoal/80 leading-relaxed font-serif italic border-l-2 border-gold pl-4">
            {post.excerpt}
          </p>

          <div className="mt-6 flex items-center gap-3 border-y border-charcoal/10 py-4 text-sm text-charcoal/70">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-white font-medium text-xs">
              <User size={15} aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-forest">
                {post.author?.name ?? "Travelora Editorial"}
              </p>
              <p className="text-xs text-charcoal/50">
                Staff Journalist & Curator
              </p>
            </div>
          </div>

          <div className="mt-10">
            <BlogContentRenderer content={post.content} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 border-t border-charcoal/10 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Tag size={14} className="text-gold" aria-hidden="true" />
                <span className="text-xs font-medium text-charcoal/60">Tagged in:</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ivory px-3 py-1 text-xs text-charcoal/70 border border-charcoal/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {post.relatedPackage && (
            <div className="mt-12 rounded-xl border border-forest/20 bg-forest/5 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Featured Journey
              </p>
              <h2 className="font-display mt-2 text-2xl text-forest">
                {post.relatedPackage.title}
              </h2>
              <p className="mt-1 text-sm text-charcoal/70">
                Destination: {post.relatedPackage.destination} · {post.relatedPackage.durationDays} Days · {post.relatedPackage.category}
              </p>
              <div className="mt-4">
                <Link
                  href={`/packages/${post.relatedPackage.slug}`}
                  target="_blank"
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-5 text-xs font-medium text-white hover:bg-forest/90"
                >
                  View journey details
                </Link>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
