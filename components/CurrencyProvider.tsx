"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { formatCurrency } from "@/lib/currencies";

type CurrencyContextValue = {
  currency: string;
  format: (amount: number) => string;
  setCurrency: (code: string) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: string;
  children: ReactNode;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);

  async function setCurrency(code: string) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: code }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not update currency.");
    }
    setCurrencyState(code);
  }

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      format: (amount: number) => formatCurrency(amount, currency),
      setCurrency,
    }),
    [currency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
