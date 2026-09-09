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

export function calculateGraPayeTax(taxableIncome: number): number {
  if (taxableIncome <= 490) return 0;

  let tax = 0;
  let remaining = taxableIncome;

  // Band 1: First GH₵ 490 @ 0%
  remaining -= 490;

  // Band 2: Next GH₵ 110 (490 - 600) @ 5%
  const band2 = Math.min(remaining, 110);
  tax += band2 * 0.05;
  remaining -= band2;
  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Band 3: Next GH₵ 130 (600 - 730) @ 10%
  const band3 = Math.min(remaining, 130);
  tax += band3 * 0.10;
  remaining -= band3;
  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Band 4: Next GH₵ 3,166.67 @ 17.5%
  const band4 = Math.min(remaining, 3166.67);
  tax += band4 * 0.175;
  remaining -= band4;
  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Band 5: Next GH₵ 16,000 @ 25%
  const band5 = Math.min(remaining, 16000);
  tax += band5 * 0.25;
  remaining -= band5;
  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Band 6: Next GH₵ 30,520 @ 30%
  const band6 = Math.min(remaining, 30520);
  tax += band6 * 0.30;
  remaining -= band6;
  if (remaining <= 0) return Math.round(tax * 100) / 100;

  // Band 7: Above GH₵ 50,416.67 @ 35%
  tax += remaining * 0.35;

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
  petraErRate: number = 5.0
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
  const paye_tax_amount = calculateGraPayeTax(taxableIncome);

  // Employee statutory deductions: SSNIT Emp 5.5% + GRA PAYE Tax (Petra is on hold)
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
