import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// Precomputed at module load so a login attempt for a non-existent email
// still pays the full bcrypt cost — otherwise response timing leaks which
// emails are registered.
const DUMMY_HASH = bcrypt.hashSync("timing-attack-mitigation", 12);

// Distinct error code so the login page can offer a "resend code" link.
// Safe to reveal here (unlike email-existence) since reaching this branch
// already required the correct email *and* password.
export class UnverifiedEmailError extends CredentialsSignin {
  code = "unverified_email";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Runs entirely on the server: looks up the user in the DB and verifies
      // the password hash here. No credentials or codes are ever sent to a
      // third-party/cloud auth service.
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Cap by IP (spray across many emails) and by email (brute force on
        // one account) so credential stuffing can't run unthrottled.
        const ip = clientIp(request);
        const ipOk = checkRateLimit(`login:ip:${ip}`, 20, 5 * 60 * 1000);
        const emailOk = checkRateLimit(`login:email:${email}`, 5, 15 * 60 * 1000);
        if (!ipOk || !emailOk) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) return null;
        if (!user.emailVerified) throw new UnverifiedEmailError();

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
