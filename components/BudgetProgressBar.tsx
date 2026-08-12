"use client";

import { useCurrency } from "@/components/CurrencyProvider";

export default function BudgetProgressBar({
  spent,
  limit,
  color,
}: {
  spent: number;
  limit: number;
  color: string;
}) {
  const { format } = useCurrency();
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = spent > limit;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={over ? "font-medium text-red-600" : ""}>
          {format(spent)} / {format(limit)}
        </span>
        {over && <span className="text-xs font-medium text-red-600">Over budget</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : color }}
        />
      </div>
    </div>
  );
}
