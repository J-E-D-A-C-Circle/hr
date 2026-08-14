import { addMonths, subDays, differenceInCalendarDays, startOfDay } from "date-fns";

export type ContractStatus = "Active" | "Expiring Soon" | "Expired" | "Terminated" | "No Contract";

export interface RawContract {
  id: number;
  staff_id: number;
  start_date: Date | string;
  end_date: Date | string;
  renewal_number: number;
  is_terminated: boolean;
  termination_date?: Date | string | null;
  termination_reason?: string | null;
  is_current: boolean;
}

/**
 * Automatically calculates contract end date (+6 months minus 1 day).
 * E.g., Start Date = 1st April 2026 -> End Date = 30th September 2026
 * E.g., Start Date = 3rd August 2026 -> End Date = 2nd February 2027
 */
export function calculateEndDate(startDate: Date | string): Date {
  const start = new Date(startDate);
  return subDays(addMonths(start, 6), 1);
}

/**
 * Computes status dynamically on read according to contract rules:
 * - if is_terminated → "Terminated"
 * - else if today > end_date → "Expired"
 * - else if end_date - today <= 30 days → "Expiring Soon"
 * - else → "Active"
 */
export function computeContractStatus(
  contract: RawContract | null,
  referenceDate: Date = new Date()
): ContractStatus {
  if (!contract) return "No Contract";
  if (contract.is_terminated) return "Terminated";

  const today = startOfDay(referenceDate);
  const end = startOfDay(new Date(contract.end_date));

  if (today > end) {
    return "Expired";
  }

  const daysRemaining = differenceInCalendarDays(end, today);
  if (daysRemaining <= 30) {
    return "Expiring Soon";
  }

  return "Active";
}

/**
 * Returns exact number of days remaining until contract end date.
 * If expired, returns a negative number indicating days past expiration.
 */
export function computeDaysRemaining(
  endDate: Date | string,
  referenceDate: Date = new Date()
): number {
  const today = startOfDay(referenceDate);
  const end = startOfDay(new Date(endDate));
  return differenceInCalendarDays(end, today);
}

/**
 * Flexibly parses date strings supporting DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, and standard formats
 */
export function parseFlexibleDate(dateVal: Date | string | null | undefined): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  const trimmed = String(dateVal).trim();
  if (!trimmed) return null;

  // Check if string matches DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = trimmed.match(ddmmyyyyRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed month in JS
    const year = parseInt(match[3], 10);
    const parsedDate = new Date(year, month, day);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Fallback to standard JS Date parsing
  const fallbackDate = new Date(trimmed);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

/**
 * Format date to standard YYYY-MM-DD format for input elements
 */
export function formatDateToISO(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = parseFlexibleDate(date);
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date to DD/MM/YYYY format (e.g. "25/08/1995")
 */
export function formatDateDDMMYYYY(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = parseFlexibleDate(date);
  if (!d) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date to human-friendly display string
 */
export function formatDateReadable(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return formatDateDDMMYYYY(date);
}
