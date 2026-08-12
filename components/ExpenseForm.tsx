"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/types";
import ReceiptUpload from "@/components/ReceiptUpload";
import { useCurrency } from "@/components/CurrencyProvider";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({
  categories,
  expense,
  onSaved,
  onCancel,
  onCategoryCreated,
}: {
  categories: Category[];
  expense?: Expense;
  onSaved: (expense: Expense) => void;
  onCancel: () => void;
  onCategoryCreated: (category: Category) => void;
}) {
  const { currency } = useCurrency();
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [date, setDate] = useState(expense ? expense.date.slice(0, 10) : todayIso());
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? categories[0]?.id ?? "");
  const [note, setNote] = useState(expense?.note ?? "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(expense?.receiptUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    setCategoryError(null);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingCategory(false);

    if (!res.ok) {
      setCategoryError(data.error || "Could not add category.");
      return;
    }

    onCategoryCreated(data);
    setCategoryId(data.id);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      amount: Number(amount),
      date,
      categoryId,
      note,
      receiptUrl,
    };

    const res = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
      method: expense ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Could not save expense.");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Amount ({currency})</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        {!addingCategory ? (
          <div className="flex items-center gap-2">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="shrink-0 text-sm underline text-neutral-600 dark:text-neutral-300"
            >
              New
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={savingCategory || !newCategoryName.trim()}
              className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingCategory(false);
                setCategoryError(null);
              }}
              className="shrink-0 text-sm text-neutral-500"
            >
              Cancel
            </button>
          </div>
        )}
        {categoryError && <p className="mt-1 text-xs text-red-600">{categoryError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <ReceiptUpload value={receiptUrl} onChange={setReceiptUrl} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !categoryId}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {saving ? "Saving..." : expense ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}
