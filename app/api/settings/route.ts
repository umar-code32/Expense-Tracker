import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { CURRENCY_CODES } from "@/lib/currencies";

export async function PATCH(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currency = typeof body?.currency === "string" ? body.currency.toUpperCase() : "";

  if (!CURRENCY_CODES.includes(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { currency } });

  return NextResponse.json({ ok: true, currency });
}
