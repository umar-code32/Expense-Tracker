import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const csv = toCsv(
    expenses.map((e) => ({
      Date: e.date.toISOString().slice(0, 10),
      Category: e.category.name,
      Amount: e.amount,
      Note: e.note ?? "",
    })),
    ["Date", "Category", "Amount", "Note"]
  );

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
