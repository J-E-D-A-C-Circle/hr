import { prisma } from "./db";

/**
 * Ghana Statutory Payroll & GRA PAYE Tax Calculator
 * SSNIT-focused statutory calculations:
 * For GH₵ 1,400.00 basic salary:
 * - SSNIT Employee (5.5%): GH₵ 77.00
 * - Taxable Income: GH₵ 1,323.00
 * - GRA PAYE Income Tax: GH₵ 122.28
 * - Total Employee Deductions: GH₵ 199.28
 * - Net Take-Home Pay: GH₵ 1,200.72
 */

export async function getDeductionRates(targetMonth?: string) {
  const DEFAULT_SETTINGS = {
    ssnit_employee_rate: 5.5,
    ssnit_employer_rate: 13.0,
    petra_employee_rate: 5.0,
    petra_employer_rate: 5.0,
  };
  try {
    if (prisma && (prisma as any).deductionSetting) {
      let settings: any = null;

      if (targetMonth && targetMonth.trim()) {
        const cleanMonthStr = targetMonth.replace(/\s*\([^)]*\)/g, "").trim();
        const parts = cleanMonthStr.split(" ");
        const mName = parts[0];
        const yearVal = parseInt(parts[1] || String(new Date().getFullYear()), 10);
        const monthList = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const mIdx = monthList.indexOf(mName?.toLowerCase());
        if (mIdx !== -1) {
          const monthEndDate = new Date(yearVal, mIdx + 1, 0, 23, 59, 59);
          settings = await (prisma as any).deductionSetting.findFirst({
            where: {
              created_at: { lte: monthEndDate },
            },
            orderBy: { created_at: "desc" },
          });
        }
      }

      if (!settings) {
        settings = await (prisma as any).deductionSetting.findFirst({
          orderBy: { created_at: "desc" },
        });
      }

      if (settings) {
        return {
          ssnit_employee_rate: Number(settings.ssnit_employee_rate ?? 5.5),
          ssnit_employer_rate: Number(settings.ssnit_employer_rate ?? 13.0),
          petra_employee_rate: Number(settings.petra_employee_rate ?? 5.0),
          petra_employer_rate: Number(settings.petra_employer_rate ?? 5.0),
        };
      }
    }
  } catch (err) {
    console.error("getDeductionRates error:", err);
  }
  return DEFAULT_SETTINGS;
}

export interface PayeBracketItem {
  band_order: number;
  label: string;
  chargeable_amount: number;
  rate_percent: number;
}

export const DEFAULT_2026_GRA_BRACKETS: PayeBracketItem[] = [
  { band_order: 1, label: "First", chargeable_amount: 588.00, rate_percent: 0.0 },
  { band_order: 2, label: "Next", chargeable_amount: 80.00, rate_percent: 5.0 },
  { band_order: 3, label: "Next", chargeable_amount: 100.00, rate_percent: 10.0 },
  { band_order: 4, label: "Next", chargeable_amount: 2900.00, rate_percent: 17.5 },
  { band_order: 5, label: "Next", chargeable_amount: 16000.00, rate_percent: 25.0 },
  { band_order: 6, label: "Next", chargeable_amount: 30332.00, rate_percent: 30.0 },
  { band_order: 7, label: "Exceeding", chargeable_amount: 50000.00, rate_percent: 35.0 },
];

export async function getPayeTaxBrackets(targetMonth?: string): Promise<PayeBracketItem[]> {
  try {
    if (prisma && (prisma as any).payeTaxBracket) {
      let brackets: any[] = [];
      if (targetMonth && targetMonth.trim()) {
        const cleanMonthStr = targetMonth.replace(/\s*\([^)]*\)/g, "").trim();
        const parts = cleanMonthStr.split(" ");
        const mName = parts[0];
        const yearVal = parseInt(parts[1] || String(new Date().getFullYear()), 10);
        const monthList = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const mIdx = monthList.indexOf(mName?.toLowerCase());
        if (mIdx !== -1) {
          const monthEndDate = new Date(yearVal, mIdx + 1, 0, 23, 59, 59);
          brackets = await (prisma as any).payeTaxBracket.findMany({
            where: {
              created_at: { lte: monthEndDate },
            },
            orderBy: [{ band_order: "asc" }, { created_at: "desc" }],
          });
        }
      }

      if (!brackets || brackets.length === 0) {
        brackets = await (prisma as any).payeTaxBracket.findMany({
          orderBy: { band_order: "asc" },
        });
      }

      if (brackets && brackets.length > 0) {
        const map = new Map<number, PayeBracketItem>();
        for (const b of brackets) {
          if (!map.has(b.band_order)) {
            map.set(b.band_order, {
              band_order: b.band_order,
              label: b.label,
              chargeable_amount: Number(b.chargeable_amount),
              rate_percent: Number(b.rate_percent),
            });
          }
        }
        return Array.from(map.values()).sort((a, b) => a.band_order - b.band_order);
      }
    }
  } catch (err) {
    console.error("getPayeTaxBrackets error:", err);
  }
  return DEFAULT_2026_GRA_BRACKETS;
}

export function calculateGraPayeTax(
  taxableIncome: number,
  brackets: PayeBracketItem[] = DEFAULT_2026_GRA_BRACKETS
): number {
  if (!taxableIncome || taxableIncome <= 0) return 0;

  const sorted = [...brackets].sort((a, b) => a.band_order - b.band_order);
  const firstBand = sorted[0];
  const firstFreeLimit = firstBand ? firstBand.chargeable_amount : 588;

  if (taxableIncome <= firstFreeLimit) return 0;

  let tax = 0;
  let remaining = taxableIncome;

  for (let i = 0; i < sorted.length; i++) {
    const band = sorted[i];
    const rateFraction = band.rate_percent / 100;
    const isLast = i === sorted.length - 1;

    if (isLast) {
      tax += remaining * rateFraction;
      break;
    } else {
      const taxableInBand = Math.min(remaining, band.chargeable_amount);
      tax += taxableInBand * rateFraction;
      remaining -= taxableInBand;
      if (remaining <= 0) break;
    }
  }

  return Math.round(tax * 100) / 100;
}

export interface GhanaDeductionsResult {
  salary: number;
  ssnit_employee_amount: number;
  ssnit_employer_amount: number;
  petra_employee_amount: number;
  petra_employer_amount: number;
  paye_tax_amount: number;
  total_employee_deductions: number;
  net_take_home_salary: number;
}

export function calculateGhanaDeductions(
  salary: number,
  isPaid: boolean = true,
  ssnitEmpRate: number = 5.5,
  ssnitErRate: number = 13.0,
  petraEmpRate: number = 5.0,
  petraErRate: number = 5.0,
  payeBrackets: PayeBracketItem[] = DEFAULT_2026_GRA_BRACKETS
): GhanaDeductionsResult {
  if (!isPaid || !salary || salary <= 0) {
    return {
      salary: salary || 0,
      ssnit_employee_amount: 0,
      ssnit_employer_amount: 0,
      petra_employee_amount: 0,
      petra_employer_amount: 0,
      paye_tax_amount: 0,
      total_employee_deductions: 0,
      net_take_home_salary: 0,
    };
  }

  const ssnit_employee_amount = Math.round(((salary * ssnitEmpRate) / 100) * 100) / 100;
  const ssnit_employer_amount = Math.round(((salary * ssnitErRate) / 100) * 100) / 100;
  const petra_employee_amount = Math.round(((salary * petraEmpRate) / 100) * 100) / 100;
  const petra_employer_amount = Math.round(((salary * petraErRate) / 100) * 100) / 100;

  const taxableIncome = Math.max(0, salary - ssnit_employee_amount);
  const paye_tax_amount = calculateGraPayeTax(taxableIncome, payeBrackets);

  // Employee statutory deductions: SSNIT Emp + GRA PAYE Tax
  const total_employee_deductions =
    Math.round((ssnit_employee_amount + paye_tax_amount) * 100) / 100;

  const net_take_home_salary =
    Math.round(Math.max(0, salary - total_employee_deductions) * 100) / 100;

  return {
    salary,
    ssnit_employee_amount,
    ssnit_employer_amount,
    petra_employee_amount,
    petra_employer_amount,
    paye_tax_amount,
    total_employee_deductions,
    net_take_home_salary,
  };
}

