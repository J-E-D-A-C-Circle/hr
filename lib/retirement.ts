import { addYears, differenceInDays, differenceInMonths, differenceInYears, format, startOfDay } from "date-fns";

export const STATUTORY_RETIREMENT_AGE = 60;

export type RetirementStatus = "ACTIVE" | "NEARING_RETIREMENT" | "DUE_THIS_YEAR" | "RETIRED";

export interface RetirementCalculationResult {
  currentAge: number;
  currentAgeFormatted: string;
  retirementDate: Date;
  retirementDateFormatted: string;
  yearsRemaining: number;
  monthsRemaining: number;
  daysRemaining: number;
  timeRemainingFormatted: string;
  status: RetirementStatus;
  statusLabel: string;
  badgeVariant: "default" | "success" | "warning" | "destructive" | "secondary";
  percentageCompleted: number; // 0 - 100 based on typical career
}

/**
 * Calculates statutory retirement metrics based on Date of Birth and optional Date of First Appointment
 */
export function calculateRetirement(
  dateOfBirthInput: Date | string,
  dateOfFirstAppointmentInput?: Date | string | null,
  referenceDateInput: Date = new Date()
): RetirementCalculationResult {
  const dob = typeof dateOfBirthInput === "string" ? new Date(dateOfBirthInput) : dateOfBirthInput;
  const refDate = startOfDay(referenceDateInput);
  
  // Retirement date is exactly 60 years after Date of Birth
  const retirementDate = startOfDay(addYears(dob, STATUTORY_RETIREMENT_AGE));

  // Current age in exact years & months
  const currentAgeYears = Math.floor(differenceInDays(refDate, dob) / 365.25);
  const totalMonthsOfAge = differenceInMonths(refDate, dob);
  const remainingAgeMonths = Math.max(0, totalMonthsOfAge % 12);
  const currentAgeFormatted = `${Math.max(0, currentAgeYears)}y ${remainingAgeMonths}m`;

  // Time remaining to retirement
  const totalDaysRemaining = differenceInDays(retirementDate, refDate);
  const totalMonthsRemaining = Math.max(0, differenceInMonths(retirementDate, refDate));
  const yearsRemaining = Math.floor(totalMonthsRemaining / 12);
  const monthsRemainingInYear = totalMonthsRemaining % 12;

  // Status calculation
  let status: RetirementStatus;
  let statusLabel: string;
  let badgeVariant: "default" | "success" | "warning" | "destructive" | "secondary";
  let timeRemainingFormatted: string;

  if (totalDaysRemaining <= 0 || currentAgeYears >= STATUTORY_RETIREMENT_AGE) {
    status = "RETIRED";
    statusLabel = "Retired";
    badgeVariant = "secondary";
    timeRemainingFormatted = "Exited";
  } else if (yearsRemaining < 1 || totalMonthsRemaining < 12) {
    status = "DUE_THIS_YEAR";
    statusLabel = "Due This Year";
    badgeVariant = "destructive";
    timeRemainingFormatted = totalMonthsRemaining <= 0 ? `${totalDaysRemaining}d` : `${totalMonthsRemaining}m`;
  } else if (yearsRemaining <= 5) {
    status = "NEARING_RETIREMENT";
    statusLabel = "Nearing Retirement";
    badgeVariant = "warning";
    timeRemainingFormatted = monthsRemainingInYear > 0 ? `${yearsRemaining}y ${monthsRemainingInYear}m` : `${yearsRemaining}y`;
  } else {
    status = "ACTIVE";
    statusLabel = "Active";
    badgeVariant = "success";
    timeRemainingFormatted = monthsRemainingInYear > 0 ? `${yearsRemaining}y ${monthsRemainingInYear}m` : `${yearsRemaining}y`;
  }

  // Calculate percentage of career completed (DOFA -> Retirement Date)
  let percentageCompleted = 100;
  if (status !== "RETIRED") {
    const dofa = dateOfFirstAppointmentInput
      ? (typeof dateOfFirstAppointmentInput === "string" ? new Date(dateOfFirstAppointmentInput) : dateOfFirstAppointmentInput)
      : addYears(dob, 25);

    const totalCareerDays = Math.max(1, differenceInDays(retirementDate, dofa));
    const servedDays = Math.max(0, differenceInDays(refDate, dofa));
    percentageCompleted = Math.min(100, Math.max(0, Math.round((servedDays / totalCareerDays) * 100)));
  }

  return {
    currentAge: Math.max(0, currentAgeYears),
    currentAgeFormatted,
    retirementDate,
    retirementDateFormatted: format(retirementDate, "dd MMM yyyy"),
    yearsRemaining: Math.max(0, yearsRemaining),
    monthsRemaining: Math.max(0, totalMonthsRemaining),
    daysRemaining: Math.max(0, totalDaysRemaining),
    timeRemainingFormatted,
    status,
    statusLabel,
    badgeVariant,
    percentageCompleted,
  };
}

/**
 * Validates Date of Birth (Age between 18 and 100)
 */
export function validateDateOfBirth(dob: Date | string): { valid: boolean; message?: string } {
  const d = typeof dob === "string" ? new Date(dob) : dob;
  if (isNaN(d.getTime())) {
    return { valid: false, message: "Invalid date format" };
  }
  const age = Math.floor(differenceInDays(new Date(), d) / 365.25);
  if (age < 18) {
    return { valid: false, message: "Staff member must be at least 18 years old." };
  }
  if (age > 100) {
    return { valid: false, message: "Staff member age exceeds maximum limit (100 years)." };
  }
  return { valid: true };
}
