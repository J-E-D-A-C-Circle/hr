import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Automatically computes the dynamic NSS service year (e.g. "2026/2027").
 * Automatically rolls over to the current/next academic cycle.
 */
export function getAutoServiceYear(baseYearOrDate?: string | number | Date | null): string {
  const currentYear = new Date().getFullYear();
  let yearNum: number = currentYear;

  if (typeof baseYearOrDate === 'number') {
    yearNum = baseYearOrDate;
  } else if (baseYearOrDate) {
    const str = String(baseYearOrDate).trim();
    const match = str.match(/\b(20\d\d)\b/);
    if (match) {
      yearNum = parseInt(match[1], 10);
    }
  }

  if (isNaN(yearNum) || yearNum < currentYear) {
    yearNum = currentYear;
  }

  return `${yearNum}/${yearNum + 1}`;
}

/**
 * Automatically calculates the official NSS end date.
 * The end date is always "31st October" in the year following the commencement start year.
 * e.g. Start date in 2026 -> "Saturday, 31st October, 2027"
 */
export function getAutoEndDate(startDateOrYear?: string | number | Date | null): string {
  const currentYear = new Date().getFullYear();
  let startYear: number | null = null;

  if (typeof startDateOrYear === 'number') {
    startYear = startDateOrYear;
  } else if (startDateOrYear) {
    const d = new Date(startDateOrYear);
    if (!isNaN(d.getTime())) {
      startYear = d.getFullYear();
    } else {
      const match = String(startDateOrYear).match(/\b(20\d\d)\b/);
      if (match) {
        startYear = parseInt(match[1], 10);
      }
    }
  }

  if (!startYear || isNaN(startYear) || startYear < currentYear) {
    startYear = currentYear;
  }

  const nextYear = startYear + 1;
  const endD = new Date(nextYear, 9, 29); // 29th October
  const weekday = endD.toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday}, 29th October, ${nextYear}`;
}

export function getDvlaReferenceForSequence(sequenceNumber: number): string {
  return `DVLA\\HR\\NSS\\26\\${String(sequenceNumber).padStart(4, '0')}`;
}

export function getNextDvlaReferenceNumber(
  applications: Array<{ id?: number; status?: string; reviewed_at?: string | null; created_at?: string | null }>,
  currentApplicationId?: number
): string {
  const approvedApplications = applications
    .filter((app) => app.status === 'approved')
    .sort((a, b) => {
      const aDate = new Date(a.reviewed_at || a.created_at || 0).getTime();
      const bDate = new Date(b.reviewed_at || b.created_at || 0).getTime();
      return aDate - bDate;
    });

  const currentPosition = approvedApplications.findIndex((app) => app.id === currentApplicationId);
  const nextSequence = currentPosition >= 0 ? currentPosition + 1 : approvedApplications.length + 1;

  return getDvlaReferenceForSequence(nextSequence);
}


