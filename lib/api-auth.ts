import { auth } from "@/lib/auth";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Only allow receiptUrl values that point at this user's own upload folder,
// so it can't be set to a javascript:/data: URL or another user's file.
export function isValidReceiptUrl(userId: string, url: string): boolean {
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^/uploads/${escapedUserId}/[^/\\\\]+$`).test(url);
}
