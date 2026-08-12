function escapeCsvField(value: string): string {
  // Neutralize leading formula-trigger characters so spreadsheet apps
  // (Excel, Google Sheets) don't interpret user-supplied text as a formula.
  if (/^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: Record<string, string | number>[], columns: string[]): string {
  const header = columns.map(escapeCsvField).join(",");
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvField(String(row[col] ?? ""))).join(",")
  );
  return [header, ...lines].join("\r\n");
}
