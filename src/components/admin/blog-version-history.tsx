"use client";

import { useEffect, useState } from "react";

type BlogVersionItem = {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string | null;
  post: { publishedVersionId: string | null };
};

export function BlogVersionHistory({
  postId,
  canRollback,
}: {
  postId: string;
  canRollback: boolean;
}) {
  const [versions, setVersions] = useState<BlogVersionItem[]>([]);
  const [message, setMessage] = useState("");
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/blog/${postId}/versions`)
      .then((response) => response.json())
      .then((payload) => setVersions(payload.data ?? []))
      .catch(() => setMessage("Version history could not be loaded."));
  }, [postId]);

  async function rollback(versionId: string, versionNumber: number) {
    if (
      !window.confirm(
        `Restore Version ${versionNumber} and publish it as the active version?`
      )
    ) {
      return;
    }
    setRollingBackId(versionId);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/blog/${postId}/versions/${versionId}/rollback`,
        { method: "POST" }
      );
      if (!response.ok) {
        setMessage("Rollback could not be completed.");
        setRollingBackId(null);
        return;
      }
      window.location.reload();
    } catch {
      setMessage("A network error occurred while rolling back.");
      setRollingBackId(null);
    }
  }

  return (
    <section
      className="border border-charcoal/10 bg-white p-6 sm:p-8"
      aria-labelledby="blog-version-history-heading"
    >
      <h2
        id="blog-version-history-heading"
        className="font-display text-2xl text-forest"
      >
        Version history
      </h2>

      {message && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {message}
        </div>
      )}

      {versions.length === 0 ? (
        <p className="mt-5 text-sm text-charcoal/60">
          No published versions yet. Articles gain immutable versions when published.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-charcoal/10">
          {versions.map((version) => (
            <div
              key={version.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-forest">
                  Version {version.versionNumber}
                </p>
                <p className="mt-1 text-xs text-charcoal/50">
                  {new Date(version.createdAt).toLocaleString("en-IN")} ·{" "}
                  {version.createdBy ?? "Editorial team"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {version.post.publishedVersionId === version.id && (
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-deep-green">
                    Live
                  </span>
                )}

                {canRollback && (
                  <button
                    type="button"
                    disabled={rollingBackId === version.id}
                    onClick={() => rollback(version.id, version.versionNumber)}
                    aria-label={`Rollback to version ${version.versionNumber}`}
                    className="rounded px-2 py-1 text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50 cursor-pointer"
                  >
                    {rollingBackId === version.id ? "Restoring..." : "Restore"}
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
