export const CURRENCIES: { code: string; label: string }[] = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "PKR", label: "Pakistani Rupee" },
  { code: "INR", label: "Indian Rupee" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "ZAR", label: "South African Rand" },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);
export const DEFAULT_CURRENCY = "USD";

const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency: string): string {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, { style: "currency", currency });
    formatterCache.set(currency, formatter);
  }
  return formatter.format(amount);
}
