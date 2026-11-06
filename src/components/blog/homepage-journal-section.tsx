"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";

export type JournalArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  featuredImage?: string | null;
  imageAlt?: string | null;
  publishedAt?: string | null;
  content?: string;
  authorName?: string | null;
};

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    () => false
  );
}

function estimateReadingTime(content?: string, excerpt?: string): number {
  const text = (content || excerpt || "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "";
  }
}

export function HomepageJournalSection({
  articles,
}: {
  articles: JournalArticle[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const expandedGridRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute number of cards per view based on viewport:
  // Desktop: 3, Tablet: 2, Mobile: 1
  // Total pages:
  const total = articles.length;
  const maxIndex = Math.max(0, total - 1);

  // Auto-movement timer
  useEffect(() => {
    if (prefersReducedMotion || isPaused || total <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, maxIndex, prefersReducedMotion, total]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const toggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState) {
      setTimeout(() => {
        expandedGridRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  if (!articles || articles.length === 0) {
    return (
      <section className="bg-ivory border-t border-charcoal/10 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">TRAVEL JOURNAL</p>
          <h2 className="font-display mt-4 text-4xl sm:text-5xl text-forest">Stories for the journey</h2>
          <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-8 text-center sm:p-12">
            <BookOpen className="mx-auto text-gold mb-3" size={32} aria-hidden="true" />
            <p className="text-sm font-medium text-forest">Our dispatches from South India will appear here soon.</p>
            <p className="mt-1 text-xs text-charcoal/60">
              Quiet trails, architectural histories, and local insights are being shaped by our editorial atelier.
            </p>
            <Link
              href="/packages"
              className="mt-6 inline-flex rounded-full bg-deep-green px-6 py-2.5 text-xs font-medium text-white hover:bg-forest transition"
            >
              Explore our journey collection
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-ivory border-t border-charcoal/10 px-6 py-24 sm:px-10 lg:px-16 lg:py-32"
      aria-labelledby="journal-heading"
    >
      <div className="mx-auto max-w-7xl">
        {/* Editorial Section Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              TRAVEL JOURNAL
            </p>
            <h2
              id="journal-heading"
              className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl text-forest tracking-[-0.02em]"
            >
              Stories for the journey
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-charcoal/70 font-light">
              Considered writings on South Indian destinations, heritage traditions, quiet backwaters,
              and local encounters that reveal the character of a place.
            </p>
          </div>

          {/* Carousel Controls */}
          {articles.length > 1 && (
            <div className="flex items-center gap-3 self-start md:self-end">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous journal stories"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/20 bg-white text-forest transition hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold cursor-pointer"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next journal stories"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/20 bg-white text-forest transition hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold cursor-pointer"
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Container */}
        <div
          className="mt-12 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-out gap-6"
            style={{
              transform: `translateX(-${currentIndex * (100 / Math.min(articles.length, 1))}%)`,
            }}
          >
            {/* Carousel Item Track */}
            {articles.map((article, idx) => (
              <div
                key={article.id}
                className="w-full flex-shrink-0 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <JournalCard article={article} priority={idx === 0} />
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Indicators */}
        {articles.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {articles.map((article, idx) => (
              <button
                key={article.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}: ${article.title}`}
                className={`h-1.5 transition-all rounded-full ${
                  currentIndex === idx ? "w-8 bg-forest" : "w-2 bg-charcoal/20 hover:bg-charcoal/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Expand / View All Actions */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-charcoal/10 pt-8">
          <button
            type="button"
            onClick={toggleExpand}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest bg-forest px-8 text-sm font-medium text-white transition hover:bg-deep-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold cursor-pointer"
          >
            {isExpanded
              ? "Collapse collection"
              : `View all journals (${articles.length})`}
          </button>

          <Link
            href="/blog"
            className="text-sm font-medium text-forest hover:text-gold transition underline decoration-gold underline-offset-8"
          >
            Visit dedicated Journal archive <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Expanded Grid View */}
        {isExpanded && (
          <div ref={expandedGridRef} id="all-journal-stories" className="mt-12 space-y-8 animate-fadeIn">
            <div className="border-b border-charcoal/10 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Complete Collection</p>
              <h3 className="font-display mt-2 text-2xl sm:text-3xl text-forest">All published journal dispatches</h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <JournalCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function JournalCard({
  article,
  priority = false,
}: {
  article: JournalArticle;
  priority?: boolean;
}) {
  const readingTime = estimateReadingTime(article.content, article.excerpt);
  const formattedDate = formatDate(article.publishedAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl">
      <Link
        href={`/blog/${article.slug}`}
        aria-label={`Read ${article.title}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-forest/5"
      >
        {article.featuredImage ? (
          <Image
            src={article.featuredImage}
            alt={article.imageAlt || article.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-deep-green/10 text-forest/40">
            <BookOpen size={36} aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-deep-green/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gold backdrop-blur-sm">
            {article.category}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-center gap-3 text-xs text-charcoal/50 mb-3">
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar size={13} aria-hidden="true" />
              {formattedDate}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={13} aria-hidden="true" />
            {readingTime} min read
          </span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl text-forest leading-snug group-hover:text-gold transition line-clamp-2">
          <Link href={`/blog/${article.slug}`}>{article.title}</Link>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-charcoal/65 line-clamp-3">
          {article.excerpt}
        </p>

        <div className="mt-auto pt-6 border-t border-charcoal/10">
          <Link
            href={`/blog/${article.slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-deep-green group-hover:text-gold transition"
          >
            Read story <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomepageJournalSkeleton() {
  return (
    <section className="bg-ivory border-t border-charcoal/10 px-6 py-24 sm:px-10 lg:px-16 animate-pulse">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-32 bg-charcoal/10 rounded mb-4" />
        <div className="h-10 w-96 bg-charcoal/15 rounded mb-12" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-charcoal/10 bg-white p-6">
              <div className="aspect-[16/10] bg-charcoal/10 rounded-xl mb-6" />
              <div className="h-6 w-3/4 bg-charcoal/15 rounded mb-3" />
              <div className="h-4 w-full bg-charcoal/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
