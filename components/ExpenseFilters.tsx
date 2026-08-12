"use client";

import type { Category } from "@/lib/types";

export type Filters = {
  from: string;
  to: string;
  categoryId: string;
  minAmount: string;
  maxAmount: string;
  q: string;
};

export const EMPTY_FILTERS: Filters = {
  from: "",
  to: "",
  categoryId: "",
  minAmount: "",
  maxAmount: "",
  q: "",
};

export default function ExpenseFilters({
  categories,
  filters,
  onChange,
}: {
  categories: Category[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-3 lg:grid-cols-6 dark:border-neutral-800">
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">From</label>
        <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">To</label>
        <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Category</label>
        <select value={filters.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputClass}>
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Min amount</label>
        <input type="number" step="0.01" value={filters.minAmount} onChange={(e) => set("minAmount", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Max amount</label>
        <input type="number" step="0.01" value={filters.maxAmount} onChange={(e) => set("maxAmount", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Search note</label>
        <input type="text" value={filters.q} onChange={(e) => set("q", e.target.value)} className={inputClass} />
      </div>
      <div className="col-span-2 sm:col-span-3 lg:col-span-6">
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-xs font-medium text-neutral-500 underline"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
