/** Counts use the digits shown in data entry, not the decimal parser used by frequency. */
export function parseWeeklyMarketingCount(raw: string | number | null): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!/^\d[\d.,]*$/.test(text)) return null;
  const value = Number(text.replace(/[.,]/g, ""));
  return Number.isSafeInteger(value) ? value : null;
}
