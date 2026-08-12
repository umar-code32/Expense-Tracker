"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/components/CurrencyProvider";

export function CategoryPieChart({
  data,
}: {
  data: { name: string; color: string; value: number }[];
}) {
  const { format } = useCurrency();

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
        No expenses this month yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => format(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({ data }: { data: { month: string; total: number }[] }) {
  const { format } = useCurrency();

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => format(Number(value))} />
        <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
