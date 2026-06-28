"use client";

import { useState } from "react";
import { getOrCreateShareToken } from "./share-actions";

export function ShareLink() {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getLink() {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrCreateShareToken();
      if (!result.success) throw new Error(result.error);
      setUrl(`${window.location.origin}/share/${result.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create a share link");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!url) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={getLink}
          disabled={loading}
          className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)] disabled:opacity-50"
        >
          {loading ? "Creating link…" : "Get a shareable link"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="truncate rounded-btn border border-field-border bg-field px-4 py-3 text-sm text-muted">
        {url}
      </div>
      <button
        type="button"
        onClick={copy}
        className="rounded-btn border border-field-border bg-field px-4 py-3 text-sm font-semibold text-ink"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
