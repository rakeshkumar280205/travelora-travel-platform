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

  async function rollback(versionId: string, versionNumber: number) {
    if (!window.confirm(`Restore Version ${versionNumber} and publish it as a new public version?`)) return;
    const response = await fetch(`/api/admin/packages/${packageId}/versions/${versionId}/rollback`, { method: "POST" });
    if (!response.ok) {
      setMessage("Rollback could not be completed.");
      return;
    }
    window.location.reload();
  }

  return (
    <section className="border border-charcoal/10 bg-white p-6 sm:p-8" aria-labelledby="version-history-heading">
      <h2 id="version-history-heading" className="font-display text-2xl text-forest">Version history</h2>
      {message && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {message}
        </div>
      )}
      {versions.length === 0 ? (
        <p className="mt-5 text-sm text-charcoal/60">No published versions yet.</p>
      ) : (
        <div className="mt-5 divide-y divide-charcoal/10">
          {versions.map((version) => (
            <div key={version.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-forest">Version {version.versionNumber}</p>
                <p className="mt-1 text-xs text-charcoal/50">{new Date(version.createdAt).toLocaleString("en-IN")} · {version.createdBy ?? "System migration"}</p>
              </div>
              <div className="flex items-center gap-4">
                {version.package.publishedVersionId === version.id && (
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-deep-green">
                    Current
                  </span>
                )}
                {canRollback && (
                  <button
                    type="button"
                    onClick={() => rollback(version.id, version.versionNumber)}
                    aria-label={`Rollback to version ${version.versionNumber}`}
                    className="rounded text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold px-2 py-1 cursor-pointer"
                  >
                    Rollback
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
