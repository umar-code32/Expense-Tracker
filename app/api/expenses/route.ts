import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isValidReceiptUrl } from "@/lib/api-auth";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const categoryId = searchParams.get("categoryId");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");
  const q = searchParams.get("q");

  const where: Prisma.ExpenseWhereInput = { userId };

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (categoryId) where.categoryId = categoryId;
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = Number(minAmount);
    if (maxAmount) where.amount.lte = Number(maxAmount);
  }
  if (q) where.note = { contains: q };

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const date = body?.date ? new Date(body.date) : null;
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  const note = typeof body?.note === "string" ? body.note.trim() : null;
  const receiptUrl = typeof body?.receiptUrl === "string" ? body.receiptUrl : null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }
  if (!date || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "A category is required." }, { status: 400 });
  }
  if (receiptUrl && !isValidReceiptUrl(userId, receiptUrl)) {
    return NextResponse.json({ error: "Invalid receipt URL." }, { status: 400 });
  }

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: { userId, categoryId, amount, date, note: note || null, receiptUrl },
    include: { category: true },
  });

  return NextResponse.json(expense, { status: 201 });
}
