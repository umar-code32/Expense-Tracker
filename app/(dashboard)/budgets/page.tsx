"use client";

import { useEffect, useState } from "react";
import type { Budget, Category } from "@/lib/types";
import CategoryBadge from "@/components/CategoryBadge";
import BudgetProgressBar from "@/components/BudgetProgressBar";

export default function BudgetsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [catsRes, budgetsRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/budgets"),
    ]);
    setCategories(await catsRes.json());
    setBudgets(await budgetsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    // load() sets `loading` synchronously before its first await, by design,
    // so the UI shows a loading state immediately on mount/refetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, monthlyLimit: Number(monthlyLimit) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Could not save budget.");
      return;
    }

    setCategoryId("");
    setMonthlyLimit("");
    load();
  }

  async function handleDelete(budget: Budget) {
    if (!confirm(`Remove budget for ${budget.category.name}?`)) return;
    const res = await fetch(`/api/budgets/${budget.id}`, { method: "DELETE" });
    if (res.ok) {
      setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
    }
  }

  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Budgets</h1>
      <p className="text-sm text-neutral-500">
        Set a monthly spending limit per category and track progress against it.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {budgetedCategoryIds.has(c.id) ? " (update)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Monthly limit</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !categoryId}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "Saving..." : "Set budget"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : budgets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No budgets set yet.
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => (
            <div key={b.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-2 flex items-center justify-between">
                <CategoryBadge name={b.category.name} color={b.category.color} />
                <button onClick={() => handleDelete(b)} className="text-xs text-red-600 underline">
                  Remove
                </button>
              </div>
              <BudgetProgressBar spent={b.spent} limit={b.monthlyLimit} color={b.category.color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
