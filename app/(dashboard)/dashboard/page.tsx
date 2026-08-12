"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Expense } from "@/lib/types";
import CategoryBadge from "@/components/CategoryBadge";
import { CategoryPieChart, MonthlyTrendChart } from "@/components/DashboardCharts";
import { useCurrency } from "@/components/CurrencyProvider";

type DashboardData = {
  monthTotal: number;
  categoryBreakdown: { name: string; color: string; value: number }[];
  recentExpenses: Expense[];
  monthlyTrend: { month: string; total: number }[];
};

export default function DashboardPage() {
  const { format } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">This month&apos;s spending</p>
        <p className="mt-1 text-3xl font-semibold">{format(data.monthTotal)}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">Spend by category</h2>
          <CategoryPieChart data={data.categoryBreakdown} />
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-medium text-neutral-500">Last 6 months</h2>
          <MonthlyTrendChart data={data.monthlyTrend} />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500">Recent transactions</h2>
          <Link href="/expenses" className="text-sm underline">
            View all
          </Link>
        </div>
        {data.recentExpenses.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No expenses yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentExpenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">{e.date.slice(0, 10)}</span>
                  <CategoryBadge name={e.category.name} color={e.category.color} />
                  {e.note && <span className="text-neutral-500">{e.note}</span>}
                </div>
                <span className="font-medium">{format(e.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
