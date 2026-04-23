import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const _dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Format a date as DD/MM/YYYY (pt-BR). Accepts Date, ISO string, or YYYY-MM-DD. */
export function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`  // noon to avoid UTC-offset day shift
      : value
  );
  if (isNaN(d.getTime())) return String(value);
  return _dateFormatter.format(d);
}
