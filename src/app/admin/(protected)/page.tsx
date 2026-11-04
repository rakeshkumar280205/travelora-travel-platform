import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, FileText, Users } from "lucide-react";

import { getAdminDashboardData } from "@/server/services/package-service";

export default async function AdminDashboardPage() {
  const { stats, recentPackages } = await getAdminDashboardData();

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold">Overview</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Good morning, team.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-charcoal/60">
          A clear view of the journeys and content shaping Travelora today.
        </p>
      </header>

      <section aria-label="Dashboard statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total packages" value={stats.totalPackages} icon={<BriefcaseBusiness size={19} />} />
        <StatCard label="Published" value={stats.publishedPackages} icon={<CheckCircle2 size={19} />} />
        <StatCard label="Drafts" value={stats.draftPackages} icon={<FileText size={19} />} />
        <StatCard label="Staff users" value={stats.totalStaffUsers} icon={<Users size={19} />} />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="border border-charcoal/10 bg-white">
          <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Content</p>
              <h2 className="font-display mt-2 text-2xl text-forest">Recent packages</h2>
            </div>
            <Link href="/admin/packages" className="text-xs font-medium text-forest hover:text-gold">
              Manage all <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {recentPackages.length > 0 ? (
            <div className="divide-y divide-charcoal/10">
              {recentPackages.map((packageRecord) => (
                <div key={packageRecord.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium text-forest">{packageRecord.title}</h3>
                    <p className="mt-1 text-sm text-charcoal/55">
                      {packageRecord.destination} · {packageRecord.durationDays} days
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <StatusBadge status={packageRecord.status} />
                    <span className="text-xs text-charcoal/45">
                      {formatDate(packageRecord.updatedAt)}
                    </span>
                    <Link
                      href={`/admin/packages#${packageRecord.id}`}
                      aria-label={`Manage ${packageRecord.title}`}
                      className="rounded-full p-2 text-forest hover:bg-ivory hover:text-gold"
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No packages yet" body="Create your first journey to see it here." />
          )}
        </section>

        <section className="border border-charcoal/10 bg-white">
          <div className="border-b border-charcoal/10 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Audit trail</p>
            <h2 className="font-display mt-2 text-2xl text-forest">Recent activity</h2>
          </div>
          <EmptyState
            title="No activity recorded"
            body="Package and staff activity will appear here when activity tracking is available."
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="border border-charcoal/10 bg-white p-6">
      <div className="flex items-center justify-between text-gold">
        <span className="text-xs uppercase tracking-[0.16em] text-charcoal/50">{label}</span>
        {icon}
      </div>
      <p className="font-display mt-6 text-4xl text-forest">{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
      status === "PUBLISHED" ? "bg-forest/10 text-forest" : "bg-gold/20 text-deep-green"
    }`}>
      {status.toLowerCase()}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-display text-xl text-forest">{title}</p>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-charcoal/55">{body}</p>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}
