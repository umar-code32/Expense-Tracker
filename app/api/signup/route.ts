import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkRateLimit(`signup:ip:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name, passwordHash },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        userId: user.id,
        name: c.name,
        color: c.color,
        isDefault: true,
      })),
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
