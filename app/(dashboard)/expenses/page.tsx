"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Expense } from "@/lib/types";
import ExpenseFilters, { EMPTY_FILTERS, type Filters } from "@/components/ExpenseFilters";
import ExpenseTable from "@/components/ExpenseTable";
import ExpenseForm from "@/components/ExpenseForm";
import Modal from "@/components/Modal";

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; expense: Expense } | null>(
    null
  );

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.minAmount) params.set("minAmount", filters.minAmount);
    if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
    if (filters.q) params.set("q", filters.q);

    const res = await fetch(`/api/expenses?${params.toString()}`);
    if (!res.ok) {
      setError("Could not load expenses.");
      setLoading(false);
      return;
    }
    setExpenses(await res.json());
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    // loadExpenses sets `loading` synchronously before its first await, by
    // design, so the UI shows a loading state immediately on mount/refetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpenses();
  }, [loadExpenses]);

  function handleSaved() {
    setModal(null);
    loadExpenses();
  }

  async function handleDelete(expense: Expense) {
    if (!confirm(`Delete this ${expense.category.name} expense?`)) return;
    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    }
  }

  function handleCategoryCreated(category: Category) {
    setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <div className="flex items-center gap-3">
          <a
            href="/api/export"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Export CSV
          </a>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Add expense
          </button>
        </div>
      </div>

      <ExpenseFilters categories={categories} filters={filters} onChange={setFilters} />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : (
        <ExpenseTable expenses={expenses} onEdit={(e) => setModal({ mode: "edit", expense: e })} onDelete={handleDelete} />
      )}

      {modal && (
        <Modal title={modal.mode === "create" ? "Add expense" : "Edit expense"} onClose={() => setModal(null)}>
          <ExpenseForm
            categories={categories}
            expense={modal.mode === "edit" ? modal.expense : undefined}
            onSaved={handleSaved}
            onCancel={() => setModal(null)}
            onCategoryCreated={handleCategoryCreated}
          />
        </Modal>
      )}
    </div>
  );
}
