import { redirect } from "next/navigation";
import { BlogForm } from "@/components/admin/blog-form";
import { getStaffSession } from "@/server/services/authorization";
import { getAdminPackages } from "@/server/services/package-service";

export const instant = false;

export default async function NewBlogPage() {
  const [session, packages] = await Promise.all([
    getStaffSession(),
    getAdminPackages(),
  ]);

  if (!session || session.user.role === "CONSULTANT") {
    redirect("/admin/blog");
  }

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
          Draft New Article
        </h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          Create an editorial journal story, travel guide, or cultural dispatch.
        </p>
      </header>

      <BlogForm
        packageOptions={packageOptions}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          category: "",
          tags: [],
          featuredImage: "",
          imageAlt: "",
          relatedPackageId: "",
          seoTitle: "",
          seoDescription: "",
          status: "DRAFT",
        }}
      />
    </div>
  );
}
