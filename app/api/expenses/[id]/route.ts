import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isValidReceiptUrl } from "@/lib/api-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const date = body?.date ? new Date(body.date) : null;
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  const note = typeof body?.note === "string" ? body.note.trim() : null;
  const receiptUrl =
    body?.receiptUrl === undefined ? existing.receiptUrl : (body.receiptUrl || null);

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

  const expense = await prisma.expense.update({
    where: { id },
    data: { amount, date, categoryId, note: note || null, receiptUrl },
    include: { category: true },
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
