import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

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
  if (existing && existing.emailVerified) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  // An existing-but-unverified row means a prior signup never completed
  // verification (closed tab, lost the code, etc.) — restart it in place
  // rather than permanently blocking that email behind a dead 409.
  let userId: string;
  try {
    userId = await (existing
      ? prisma.user
          .update({
            where: { id: existing.id },
            data: { name, passwordHash: await bcrypt.hash(password, 12) },
          })
          .then((u) => u.id)
      : prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { email, name, passwordHash: await bcrypt.hash(password, 12) },
          });
          await tx.category.createMany({
            data: DEFAULT_CATEGORIES.map((c) => ({
              userId: user.id,
              name: c.name,
              color: c.color,
              isDefault: true,
            })),
          });
          return user.id;
        }));
  } catch (err) {
    // The `email` column is unique at the DB level, so this is the only way
    // two concurrent signups for the same new email can end up here — the
    // findUnique check above can't see the other request's not-yet-committed
    // row. Without this, the loser would surface as an unhandled 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }
    throw err;
  }

  const otp = generateOtp();
  await prisma.emailOtp.create({
    data: { userId, codeHash: hashOtp(otp), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    if (!existing) {
      // Fresh signup: don't leave an unreachable account behind if we
      // couldn't even deliver the first code.
      await prisma.user.delete({ where: { id: userId } });
    }
    console.error("Failed to send verification email:", err);
    return NextResponse.json(
      { error: "Couldn't send the verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, email }, { status: 201 });
}
