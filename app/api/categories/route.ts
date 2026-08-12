import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const color = typeof body?.color === "string" && body.color ? body.color : "#6366f1";

  if (!name) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  const existing = await prisma.category.findFirst({ where: { userId, name } });
  if (existing) {
    return NextResponse.json({ error: "You already have a category with that name." }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: { userId, name, color, isDefault: false },
  });

  return NextResponse.json(category, { status: 201 });
}
