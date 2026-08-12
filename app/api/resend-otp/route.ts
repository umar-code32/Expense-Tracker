import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

function genericResponse() {
  return NextResponse.json({
    ok: true,
    message: "If an account with that email needs verification, a new code has been sent.",
  });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Rate-limited but always answered the same way below, so a failed limit
  // check can't be used to distinguish real accounts from made-up ones.
  const ipOk = checkRateLimit(`resend-otp:ip:${ip}`, 8, 15 * 60 * 1000);
  const emailOk = checkRateLimit(`resend-otp:email:${email}`, 3, 15 * 60 * 1000);
  if (!ipOk || !emailOk) {
    return genericResponse();
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const otp = generateOtp();
    try {
      await prisma.$transaction([
        prisma.emailOtp.deleteMany({ where: { userId: user.id } }),
        prisma.emailOtp.create({
          data: {
            userId: user.id,
            codeHash: hashOtp(otp),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
          },
        }),
      ]);
      await sendOtpEmail(email, otp);
    } catch (err) {
      // Swallow send failures here too — surfacing them would let an
      // attacker distinguish "account exists" from "account doesn't exist"
      // by response shape.
      console.error("Failed to resend verification email:", err);
    }
  }

  return genericResponse();
}
