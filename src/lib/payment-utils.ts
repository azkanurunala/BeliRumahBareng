import type { InstallmentPlan, MonthlyPayment, Project } from './types';
import { format, parse, addMonths, isAfter, isBefore, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale/id';

/**
 * Calculate remaining amount to be paid for an installment plan
 * Note: Sisa Cicilan excludes DP, only calculates remaining installments
 */
export function calculateRemaining(plan: InstallmentPlan): number {
  // Calculate total installment amount (excluding DP)
  const totalInstallmentAmount = plan.totalAmount - (plan.downPayment || 0);
  
  // Calculate paid installments only (exclude DP payment which has period = null)
  const paidInstallments = plan.payments
    .filter(p => p.status === 'paid' && p.period !== null && p.period !== '')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  // Remaining = Total Installment Amount - Paid Installments
  return Math.max(0, totalInstallmentAmount - paidInstallments);
}

/**
 * Calculate paid percentage (0-100)
 */
export function calculatePaidPercentage(plan: InstallmentPlan): number {
  const totalPaid = plan.payments
    .filter(p => p.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  // Total includes DP + installments
  if (plan.totalAmount === 0) return 100;
  
  return Math.min(100, Math.round((totalPaid / plan.totalAmount) * 100));
}

/**
 * Get payment status based on due date and payment date
 */
export function getPaymentStatus(payment: MonthlyPayment): 'paid' | 'pending' | 'overdue' {
  if (payment.status === 'paid') return 'paid';
  
  const now = new Date();
  const dueDate = new Date(payment.dueDate);
  
  if (isAfter(now, dueDate)) {
    return 'overdue';
  }
  
  return 'pending';
}

/**
 * Get overdue payments from an installment plan
 */
export function getOverduePayments(plan: InstallmentPlan): MonthlyPayment[] {
  const now = new Date();
  return plan.payments.filter(payment => {
    if (payment.status === 'paid') return false;
    const dueDate = new Date(payment.dueDate);
    return isAfter(now, dueDate);
  });
}

/**
 * Format period (YYYY-MM) to readable format (Maret 2025)
 */
export function formatPeriod(period: string): string {
  try {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy', { locale: id });
  } catch {
    return period;
  }
}

/**
 * Get next unpaid payment from installment plan
 */
export function getNextDuePayment(plan: InstallmentPlan): MonthlyPayment | null {
  const unpaidPayments = plan.payments
    .filter(p => p.status !== 'paid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  return unpaidPayments.length > 0 ? unpaidPayments[0] : null;
}

/**
 * Get number of paid installments
 */
export function getPaidInstallmentsCount(plan: InstallmentPlan): number {
  return plan.payments.filter(p => p.status === 'paid' && p.period && p.period !== 'DP').length;
}

/**
 * Check if DP has been paid
 */
export function isDPPaid(plan: InstallmentPlan): boolean {
  if (!plan.downPayment || plan.downPayment === 0) return true; // No DP required
  
  // Check if there's a payment with period null or "DP" that is paid
  const dpPayment = plan.payments.find(p => 
    (p.period === null || p.period === 'DP' || p.period === '') && 
    p.status === 'paid'
  );
  
  if (dpPayment) {
    // Check if the amount is sufficient (with 5% tolerance)
    return dpPayment.amount >= plan.downPayment * 0.95;
  }
  
  return false;
}

/**
 * Get number of pending installments
 */
export function getPendingInstallmentsCount(plan: InstallmentPlan): number {
  return plan.payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;
}

/**
 * Calculate total amount paid
 */
export function getTotalPaid(plan: InstallmentPlan): number {
  return plan.payments
    .filter(p => p.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Get current month payment status
 */
export function getCurrentMonthPayment(plan: InstallmentPlan): MonthlyPayment | null {
  const now = new Date();
  const currentPeriod = format(now, 'yyyy-MM');
  
  return plan.payments.find(p => p.period === currentPeriod) || null;
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(payment: MonthlyPayment): boolean {
  if (payment.status === 'paid') return false;
  
  const now = new Date();
  const dueDate = new Date(payment.dueDate);
  
  return isAfter(now, dueDate);
}

/**
 * Get days until due date (negative if overdue)
 */
export function getDaysUntilDue(payment: MonthlyPayment): number {
  const now = new Date();
  const dueDate = new Date(payment.dueDate);
  
  return differenceInDays(dueDate, now);
}

/**
 * Calculate next due date based on installment plan
 */
export function getNextDueDate(plan: InstallmentPlan): string {
  const nextPayment = getNextDuePayment(plan);
  if (nextPayment) {
    return nextPayment.dueDate;
  }
  
  // If all payments are paid, calculate from last payment
  const paidPayments = plan.payments
    .filter(p => p.status === 'paid')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  if (paidPayments.length === 0) {
    return plan.startDate;
  }
  
  const lastPaidDate = new Date(paidPayments[paidPayments.length - 1].dueDate);
  const nextDueDate = addMonths(lastPaidDate, 1);
  
  return nextDueDate.toISOString();
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency input for display (with thousands separator)
 * Formats number to string with Indonesian format: 1.800.000.000
 */
export function formatCurrencyInput(value: number): string {
  if (isNaN(value) || value === 0) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse currency input string back to number
 * Removes all non-digit characters before parsing
 */
export function parseCurrencyInput(value: string): number {
  // Remove all non-digit characters
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Calculate total payment progress across all installment plans in a project
 */
export function calculateTotalPaymentProgress(project: Project): {
  paid: number;
  total: number;
  percentage: number;
} {
  if (!project.installmentPlans || project.installmentPlans.length === 0) {
    return { paid: 0, total: 0, percentage: 100 };
  }

  let totalPaid = 0;
  let totalAmount = 0;

  project.installmentPlans.forEach(plan => {
    totalAmount += plan.totalAmount;
    // getTotalPaid sudah menghitung semua payment dengan status 'paid', termasuk DP payment
    totalPaid += getTotalPaid(plan);
  });

  const percentage = totalAmount === 0 ? 100 : Math.round((totalPaid / totalAmount) * 100);

  return {
    paid: totalPaid,
    total: totalAmount,
    percentage: Math.min(100, percentage),
  };
}

