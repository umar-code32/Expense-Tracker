"use client";

import { useState } from "react";

export default function ReceiptUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }

    onChange(data.url);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Receipt (optional)</label>
      {value ? (
        <div className="flex items-center gap-3">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline text-neutral-600 dark:text-neutral-300"
          >
            View receipt
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-neutral-200 dark:text-neutral-300 dark:file:bg-neutral-800 dark:hover:file:bg-neutral-700"
        />
      )}
      {uploading && <p className="mt-1 text-xs text-neutral-500">Uploading...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
