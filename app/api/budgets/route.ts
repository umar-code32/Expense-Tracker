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

  const [budgets, spendByCategory] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const spendMap = new Map(
    spendByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0])
  );

  const result = budgets.map((b) => ({
    ...b,
    spent: spendMap.get(b.categoryId) ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  const monthlyLimit = Number(body?.monthlyLimit);

  if (!categoryId) {
    return NextResponse.json({ error: "A category is required." }, { status: 400 });
  }
  if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
    return NextResponse.json(
      { error: "Monthly limit must be a positive number." },
      { status: 400 }
    );
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const budget = await prisma.budget.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    update: { monthlyLimit },
    create: { userId, categoryId, monthlyLimit },
    include: { category: true },
  });

  return NextResponse.json(budget, { status: 201 });
}
