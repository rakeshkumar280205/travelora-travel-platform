import { notFound, redirect } from "next/navigation";
import { BlogForm } from "@/components/admin/blog-form";
import { BlogVersionHistory } from "@/components/admin/blog-version-history";
import { getStaffSession } from "@/server/services/authorization";
import { getAdminBlogPostById } from "@/server/services/blog-service";
import { getAdminPackages } from "@/server/services/package-service";

export const instant = false;

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([
    getStaffSession(),
    params,
  ]);

  if (!session || session.user.role === "CONSULTANT") {
    redirect("/admin/blog");
  }

  let postRecord;
  try {
    postRecord = await getAdminBlogPostById(id);
  } catch {
    notFound();
  }

  if (!postRecord) notFound();

  const packages = await getAdminPackages();
  const packageOptions = packages.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    destination: pkg.destination,
    slug: pkg.slug,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Journal CMS</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">
          Edit Article
        </h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          Update article content, metadata, media and cross-linked journeys.
        </p>
      </header>

      <BlogForm
        postId={postRecord.id}
        packageOptions={packageOptions}
        initial={{
          title: postRecord.title,
          slug: postRecord.slug,
          excerpt: postRecord.excerpt,
          content: postRecord.content,
          category: postRecord.category,
          tags: postRecord.tags ?? [],
          featuredImage: postRecord.featuredImage ?? "",
          imageAlt: postRecord.imageAlt ?? "",
          relatedPackageId: postRecord.relatedPackageId ?? "",
          seoTitle: postRecord.seoTitle ?? "",
          seoDescription: postRecord.seoDescription ?? "",
          status: postRecord.status,
        }}
      />

      <BlogVersionHistory
        postId={postRecord.id}
        canRollback={session.user.role !== "CONSULTANT"}
      />
    </div>
  );
}
