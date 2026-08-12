"use client";

import type { Expense } from "@/lib/types";
import CategoryBadge from "@/components/CategoryBadge";
import { useCurrency } from "@/components/CurrencyProvider";

export default function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  const { format } = useCurrency();

  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No expenses found. Add one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Note</th>
            <th className="px-4 py-2 font-medium">Receipt</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap px-4 py-2">{e.date.slice(0, 10)}</td>
              <td className="px-4 py-2">
                <CategoryBadge name={e.category.name} color={e.category.color} />
              </td>
              <td className="max-w-xs truncate px-4 py-2 text-neutral-500">{e.note}</td>
              <td className="px-4 py-2">
                {e.receiptUrl ? (
                  <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="underline">
                    View
                  </a>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-medium">
                {format(e.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right">
                <button onClick={() => onEdit(e)} className="mr-3 text-xs underline text-neutral-600 dark:text-neutral-300">
                  Edit
                </button>
                <button onClick={() => onDelete(e)} className="text-xs text-red-600 underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
