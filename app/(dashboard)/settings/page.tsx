"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { useCurrency } from "@/components/CurrencyProvider";

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const [selected, setSelected] = useState(currency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await setCurrency(selected);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update currency.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium">
            Currency
          </label>
          <select
            id="currency"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Applies to amounts across the dashboard, expenses, budgets, and CSV export.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Currency updated.</p>}

        <button
          type="submit"
          disabled={saving || selected === currency}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
