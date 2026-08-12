import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [monthExpenses, recentExpenses, trendExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: sixMonthsAgo, lt: monthEnd } },
      select: { amount: true, date: true },
    }),
  ]);

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = new Map<string, { name: string; color: string; value: number }>();
  for (const e of monthExpenses) {
    const existing = categoryTotals.get(e.categoryId);
    if (existing) {
      existing.value += e.amount;
    } else {
      categoryTotals.set(e.categoryId, {
        name: e.category.name,
        color: e.category.color,
        value: e.amount,
      });
    }
  }

  const trendMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const e of trendExpenses) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + e.amount);
    }
  }

  return NextResponse.json({
    monthTotal,
    categoryBreakdown: Array.from(categoryTotals.values()),
    recentExpenses,
    monthlyTrend: Array.from(trendMap.entries()).map(([month, total]) => ({ month, total })),
  });
}
