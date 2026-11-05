"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  PenTool,
  Quote,
  Sparkles,
} from "lucide-react";
import { BlogContentRenderer } from "@/components/blog/blog-content-renderer";
import { slugify } from "@/lib/validation/blog-schemas";

export type BlogFormData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  imageAlt: string;
  relatedPackageId: string;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
};

type PackageOption = {
  id: string;
  title: string;
  destination: string;
  slug: string;
};

export function BlogForm({
  initial,
  postId,
  packageOptions = [],
}: {
  initial: BlogFormData;
  postId?: string;
  packageOptions?: PackageOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<BlogFormData>(initial);
  const [tagInput, setTagInput] = useState(initial.tags.join(", "));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function update<K extends keyof BlogFormData>(key: K, value: BlogFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleTagChange(raw: string) {
    setTagInput(raw);
    const splitTags = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    update("tags", splitTags);
  }

  function generateSlug() {
    if (!form.title) return;
    const computed = slugify(form.title);
    update("slug", computed);
  }

  function insertMarkdown(prefix: string, suffix: string = "", placeholder: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = form.content.substring(start, end) || placeholder;

    const replacement = `${prefix}${selection}${suffix}`;
    const newContent =
      form.content.substring(0, start) + replacement + form.content.substring(end);

    update("content", newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selection.length
      );
    }, 0);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        tags: form.tags,
        featuredImage: form.featuredImage || null,
        imageAlt: form.imageAlt || null,
        relatedPackageId: form.relatedPackageId || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
      };

      const response = await fetch(
        postId ? `/api/admin/blog/${postId}` : "/api/admin/blog",
        {
          method: postId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error?.details
            ? formatValidationError(data.error.details)
            : data?.error?.message ?? "The article could not be saved."
        );
        setSaving(false);
        return;
      }

      setSuccess("Article saved successfully.");
      if (!postId && data?.data?.id) {
        router.push(`/admin/blog/${data.data.id}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setError("A network error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (
      !postId ||
      !window.confirm(
        "Publish this article live to the public Journal? This creates an immutable version snapshot."
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Save current changes first
      const saveResponse = await fetch(`/api/admin/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          tags: form.tags,
          featuredImage: form.featuredImage || null,
          imageAlt: form.imageAlt || null,
          relatedPackageId: form.relatedPackageId || null,
          seoTitle: form.seoTitle || null,
          seoDescription: form.seoDescription || null,
        }),
      });

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json().catch(() => null);
        setError(saveError?.error?.message ?? "Could not save draft before publishing.");
        setSaving(false);
        return;
      }

      const publishResponse = await fetch(`/api/admin/blog/${postId}/publish`, {
        method: "POST",
      });

      const data = await publishResponse.json().catch(() => null);

      if (!publishResponse.ok) {
        setError(
          data?.error?.details
            ? formatValidationError(data.error.details)
            : data?.error?.message ?? "The article could not be published."
        );
        setSaving(false);
        return;
      }

      setSuccess(`Version ${data.data?.versionNumber ?? ""} published live!`);
      update("status", "PUBLISHED");
      router.refresh();
    } catch {
      setError("A network error occurred while publishing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900"
        >
          {success}
        </div>
      )}

      {/* Main Metadata Section */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest">Article details</h2>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${form.status === "PUBLISHED"
                ? "bg-forest/10 text-forest"
                : "bg-gold/20 text-deep-green"
              }`}
          >
            {form.status === "PUBLISHED" ? "Published" : "Draft"}
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label="Article Title"
              value={form.title}
              onChange={(value) => update("title", value)}
              required
              placeholder="e.g. A Connoisseur's Guide to the Spice Plantations of Thekkady"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="blog-slug-input" className="block text-sm font-medium text-forest">
                Slug / URL Key <span className="text-red-600">*</span>
              </label>
              <button
                type="button"
                onClick={generateSlug}
                className="inline-flex items-center gap-1 text-xs text-forest hover:text-gold cursor-pointer"
              >
                <Sparkles size={12} aria-hidden="true" /> Generate from title
              </button>
            </div>
            <input
              id="blog-slug-input"
              type="text"
              required
              aria-required="true"
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
              placeholder="guide-to-thekkady-spice-plantations"
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
            <p className="mt-1 text-xs text-charcoal/50">
              Public address: /blog/{form.slug || "your-slug"}
            </p>
          </div>

          <div>
            <Field
              label="Category"
              value={form.category}
              onChange={(value) => update("category", value)}
              required
              placeholder="e.g. Destination Guide, Heritage, Culinary, Wildlife"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="blog-excerpt-input" className="block text-sm font-medium text-forest">
              Excerpt / Teaser Summary <span className="text-red-600">*</span>
            </label>
            <textarea
              id="blog-excerpt-input"
              required
              aria-required="true"
              rows={3}
              value={form.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              placeholder="A brief 1-2 sentence overview shown in article listings and previews..."
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label htmlFor="blog-tags-input" className="block text-sm font-medium text-forest">
              Tags (comma separated)
            </label>
            <input
              id="blog-tags-input"
              type="text"
              value={tagInput}
              onChange={(event) => handleTagChange(event.target.value)}
              placeholder="Kerala, Spice Plantations, Slow Travel"
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label htmlFor="blog-package-select" className="block text-sm font-medium text-forest">
              Related Package (cross-linked recommendation)
            </label>
            <select
              id="blog-package-select"
              value={form.relatedPackageId}
              onChange={(event) => update("relatedPackageId", event.target.value)}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
            >
              <option value="">None / Independent article</option>
              {packageOptions.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title} ({pkg.destination})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Media Section */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl text-forest">Featured imagery</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Featured Image URL"
            value={form.featuredImage}
            onChange={(value) => update("featuredImage", value)}
            placeholder="https://images.unsplash.com/... or /images/..."
          />
          <Field
            label="Accessible Image Description (Alt Text)"
            value={form.imageAlt}
            onChange={(value) => update("imageAlt", value)}
            placeholder="e.g. Cardamom pods drying under the sun at a spice estate in Kerala"
          />
        </div>
      </section>

      {/* Rich Content Editor */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-charcoal/10 pb-4">
          <div>
            <h2 className="font-display text-2xl text-forest">Content body</h2>
            <p className="mt-1 text-xs text-charcoal/60">
              Format your article using clean markdown. Headings, bullet lists, blockquotes, images, and links are supported safely.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-ivory p-1 border border-charcoal/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              aria-label="Editor tab"
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium cursor-pointer transition ${activeTab === "edit"
                  ? "bg-forest text-white"
                  : "text-charcoal/70 hover:text-forest"
                }`}
            >
              <PenTool size={13} aria-hidden="true" /> Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              aria-label="Preview tab"
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium cursor-pointer transition ${activeTab === "preview"
                  ? "bg-forest text-white"
                  : "text-charcoal/70 hover:text-forest"
                }`}
            >
              <Eye size={13} aria-hidden="true" /> Preview
            </button>
          </div>
        </div>

        {activeTab === "edit" ? (
          <div className="mt-4">
            {/* Toolbar */}
            <div
              role="toolbar"
              aria-label="Formatting toolbar"
              className="flex flex-wrap items-center gap-1 border border-charcoal/15 bg-ivory/60 p-2 text-charcoal/80"
            >
              <button
                type="button"
                onClick={() => insertMarkdown("## ", "\n", "Heading 2")}
                title="Heading 2"
                aria-label="Insert Heading 2"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <Heading2 size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("### ", "\n", "Heading 3")}
                title="Heading 3"
                aria-label="Insert Heading 3"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <Heading3 size={16} aria-hidden="true" />
              </button>
              <div className="h-4 w-px bg-charcoal/20 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**", "bold text")}
                title="Bold"
                aria-label="Insert Bold text"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <Bold size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*", "italic text")}
                title="Italic"
                aria-label="Insert Italic text"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <Italic size={16} aria-hidden="true" />
              </button>
              <div className="h-4 w-px bg-charcoal/20 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => insertMarkdown("- ", "\n", "List item")}
                title="Unordered list"
                aria-label="Insert Bullet list"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <List size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("1. ", "\n", "Numbered item")}
                title="Ordered list"
                aria-label="Insert Numbered list"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <ListOrdered size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("> ", "\n", "Quote text")}
                title="Blockquote"
                aria-label="Insert Blockquote"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <Quote size={16} aria-hidden="true" />
              </button>
              <div className="h-4 w-px bg-charcoal/20 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](https://example.com)", "Link text")}
                title="Link"
                aria-label="Insert Link"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <LinkIcon size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("![Alt description](", ")", "https://images.unsplash.com/photo-...")}
                title="Image"
                aria-label="Insert Image"
                className="rounded p-1.5 hover:bg-forest/10 hover:text-forest cursor-pointer"
              >
                <ImageIcon size={16} aria-hidden="true" />
              </button>
            </div>

            <label htmlFor="blog-content-textarea" className="sr-only">
              Article markdown content
            </label>
            <textarea
              id="blog-content-textarea"
              ref={textareaRef}
              required
              aria-required="true"
              rows={16}
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
              placeholder="Write your article in markdown format..."
              className="mt-0 w-full border-x border-b border-charcoal/15 bg-ivory p-4 font-mono text-sm leading-relaxed outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
          </div>
        ) : (
          <div className="mt-4 min-h-[300px] border border-charcoal/15 bg-white p-6">
            {form.content ? (
              <BlogContentRenderer content={form.content} />
            ) : (
              <p className="text-sm italic text-charcoal/40">
                Nothing to preview yet. Switch to the Write tab to draft your content.
              </p>
            )}
          </div>
        )}
      </section>

      {/* SEO Section */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl text-forest">Search engine metadata (SEO)</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="SEO Page Title"
            value={form.seoTitle}
            onChange={(value) => update("seoTitle", value)}
            placeholder="e.g. Travelora | The Spice Hills of Thekkady"
            maxLength={100}
          />
          <Field
            label="SEO Meta Description"
            value={form.seoDescription}
            onChange={(value) => update("seoDescription", value)}
            placeholder="e.g. Explore cardamom and pepper trails in Kerala's scenic Western Ghats with Travelora."
            maxLength={300}
          />
        </div>
      </section>

      {/* Action Footer */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-charcoal/10 pt-6">
        <Link
          href="/admin/blog"
          className="text-sm font-medium text-charcoal/70 hover:text-forest underline"
        >
          Cancel and return to list
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {postId && (
            <Link
              href={`/admin/blog/${postId}/preview`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-forest px-6 text-sm font-medium text-forest hover:bg-forest/5"
            >
              Preview live
            </Link>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-charcoal/20 bg-white px-6 text-sm font-medium text-forest hover:border-forest hover:bg-ivory disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>

          {postId && (
            <button
              type="button"
              disabled={saving}
              onClick={publish}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-deep-green hover:bg-forest hover:text-white disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Publishing..." : "Publish live"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-forest">
      {label} {required && <span className="text-red-600">*</span>}
      <input
        type={type}
        required={required}
        aria-required={required ? "true" : undefined}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
      />
    </label>
  );
}

function formatValidationError(details: Record<string, string[] | undefined>) {
  return Object.entries(details)
    .flatMap(([field, messages]) =>
      messages?.map((message) => `${field}: ${message}`) ?? []
    )
    .join(" ");
}
