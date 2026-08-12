import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import SignOutButton from "@/components/SignOutButton";
import { CurrencyProvider } from "@/components/CurrencyProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      })
    : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold">Expense Tracker</span>
            <Link href="/dashboard" className="text-sm hover:underline">
              Dashboard
            </Link>
            <Link href="/expenses" className="text-sm hover:underline">
              Expenses
            </Link>
            <Link href="/budgets" className="text-sm hover:underline">
              Budgets
            </Link>
            <Link href="/settings" className="text-sm hover:underline">
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {session?.user?.name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <CurrencyProvider initialCurrency={user?.currency ?? DEFAULT_CURRENCY}>
          {children}
        </CurrencyProvider>
      </main>
    </div>
  );
}
