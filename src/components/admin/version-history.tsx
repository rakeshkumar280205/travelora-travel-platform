"use client";

import { useEffect, useState } from "react";

type Version = { id: string; versionNumber: number; createdAt: string; createdBy: string | null; package: { publishedVersionId: string | null } };

export function VersionHistory({ packageId, canRollback }: { packageId: string; canRollback: boolean }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/admin/packages/${packageId}/versions`)
      .then((response) => response.json())
      .then((payload) => setVersions(payload.data ?? []))
      .catch(() => setMessage("Version history could not be loaded."));
  }, [packageId]);

  async function rollback(versionId: string) {
    if (!window.confirm("Restore this version and publish it as a new version?")) return;
    const response = await fetch(`/api/admin/packages/${packageId}/versions/${versionId}/rollback`, { method: "POST" });
    if (!response.ok) {
      setMessage("Rollback could not be completed.");
      return;
    }
    window.location.reload();
  }

  return (
    <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl text-forest">Version history</h2>
      {message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}
      {versions.length === 0 ? (
        <p className="mt-5 text-sm text-charcoal/55">No published versions yet.</p>
      ) : (
        <div className="mt-5 divide-y divide-charcoal/10">
          {versions.map((version) => (
            <div key={version.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-forest">Version {version.versionNumber}</p>
                <p className="mt-1 text-xs text-charcoal/50">{new Date(version.createdAt).toLocaleString("en-IN")} · {version.createdBy ?? "System migration"}</p>
              </div>
              <div className="flex items-center gap-4">
                {version.package.publishedVersionId === version.id && <span className="text-xs font-medium uppercase tracking-[0.12em] text-gold">Current</span>}
                {canRollback && <button type="button" onClick={() => rollback(version.id)} className="text-sm font-medium text-forest hover:text-gold">Rollback</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
