import { createHash, randomBytes } from "crypto";

const TOKEN_PREFIX = "capi_exp";

export function generateExportToken() {
  return `${TOKEN_PREFIX}_${randomBytes(32).toString("base64url")}`;
}

export function hashExportToken(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function tokenPrefix(token: string) {
  return token.slice(0, 18);
}

export function protectCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  if (/[",\r\n]/.test(safeText)) {
    return `"${safeText.replace(/"/g, '""')}"`;
  }
  return safeText;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(protectCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => protectCsvValue(row[header])).join(",")),
  ];
  return `\ufeff${lines.join("\r\n")}`;
}
