import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";

export type BlogCardProps = {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    featuredImage?: string | null;
    imageAlt?: string | null;
    publishedAt?: Date | string | null;
    author?: {
      name?: string | null;
    } | null;
    content?: string;
  };
};

function estimateReadingTime(content?: string, excerpt?: string): number {
  const text = (content || excerpt || "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function formatPostDate(date?: Date | string | null): string {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

export function BlogCard({ post }: BlogCardProps) {
  const readingTime = estimateReadingTime(post.content, post.excerpt);
  const formattedDate = formatPostDate(post.publishedAt);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/blog/${post.slug}`}
        aria-label={`Read article: ${post.title}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-ivory"
      >
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.imageAlt || post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-end bg-gradient-to-br from-forest to-deep-green p-6 text-white">
            <span className="font-display text-2xl tracking-wide opacity-20">
              TRAVELORA
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-forest/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-gold backdrop-blur-sm shadow-sm">
            {post.category}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-center gap-3 text-xs text-charcoal/60">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && <span aria-hidden="true">·</span>}
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> {readingTime} min read
          </span>
        </div>

        <h3 className="font-display mt-3 text-xl text-forest sm:text-2xl leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="transition group-hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold rounded"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-charcoal/70">
          {post.excerpt}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-charcoal/10 pt-4">
          <span className="text-xs font-medium text-charcoal/60">
            By {post.author?.name || "Travelora Editorial"}
          </span>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded px-1 py-0.5"
            tabIndex={-1}
            aria-hidden="true"
          >
            Read story <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
