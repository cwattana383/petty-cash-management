import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format any date to DD/MM/YYYY in Buddhist Era (BE = CE + 543).
 * Accepts: Date object, ISO string "YYYY-MM-DD", or "YYYY-MM-DDTHH:mm:ss".
 * Returns "" for falsy input.
 */
export function formatBEDate(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return String(input);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const beYear = d.getFullYear() + 543;
  return `${day}/${month}/${beYear}`;
}

/**
 * Format date+time to DD/MM/YYYY HH:mm:ss in Buddhist Era.
 */
export function formatBEDateTime(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return String(input);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const beYear = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${beYear} ${hh}:${mm}:${ss}`;
}
