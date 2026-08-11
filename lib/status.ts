import { addMonths, differenceInCalendarDays, startOfDay } from "date-fns";

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
 * Calculates start_date + 6 months on contract creation/renewal
 */
export function calculateEndDate(startDate: Date | string): Date {
  const start = new Date(startDate);
  return addMonths(start, 6);
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
 * Format date to standard YYYY-MM-DD format for inputs/APIs
 */
export function formatDateToISO(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Format date to human-friendly display string (e.g., "Oct 15, 2026")
 */
export function formatDateReadable(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
