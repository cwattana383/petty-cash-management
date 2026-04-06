import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Corporate Microsoft 365 sign-in domain for employee email. */
export const CORPORATE_EMAIL_DOMAIN = "cpaxtra.co.th";

/** True if email is a non-empty local part @cpaxtra.co.th (case-insensitive). */
export function isCorporateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@cpaxtra\.co\.th$/i.test(trimmed);
}

/**
 * Format any date to DD/MM/YYYY in Buddhist Era (พ.ศ. = CE + 543).
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
