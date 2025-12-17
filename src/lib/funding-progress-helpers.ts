'use server';

import { db } from '@/lib/db';
import { calculateFundingProgress } from '@/lib/progress-calculator';

/**
 * Generate funding progress data from payment plans and verified payments
 * Returns checklist, completedMembers, and milestones for funding category
 */
export async function generateFundingProgressData(projectId: string) {
  // Get all payment plans for the project
  const paymentPlans = await db.paymentPlan.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  if (paymentPlans.length === 0) {
    return {
      checklist: [],
      completedMembers: [],
      milestones: [],
      percentage: 0,
    };
  }

  // Get all verified payments (status='paid' and verifiedAt IS NOT NULL)
  const verifiedPayments = await db.payment.findMany({
    where: {
      projectId,
      status: 'paid',
      verifiedAt: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { verifiedAt: 'desc' },
  });

  // Calculate total required amount
  const totalRequired = paymentPlans.reduce((sum, plan) => {
    return sum + Number(plan.totalAmount);
  }, 0);

  // Calculate total verified amount
  const totalVerified = verifiedPayments.reduce((sum, payment) => {
    return sum + Number(payment.amount);
  }, 0);

  // Group verified payments by paymentPlanId
  const paymentsByPlan = new Map<string, typeof verifiedPayments>();
  for (const payment of verifiedPayments) {
    const planKey = payment.paymentPlanId || 'no-plan';
    if (!paymentsByPlan.has(planKey)) {
      paymentsByPlan.set(planKey, []);
    }
    paymentsByPlan.get(planKey)!.push(payment);
  }

  // Generate checklist items from payment plans
  const checklist: any[] = [];
  let order = 0;

  for (const plan of paymentPlans) {
    const planKey = plan.id;
    const planPayments = paymentsByPlan.get(planKey) || [];
    
    // Track which payments have been matched to avoid double counting
    const matchedPayments = new Set<string>();

    // Add DP checklist item if downPayment exists
    if (plan.downPayment && Number(plan.downPayment) > 0) {
      // Find payment that matches DP amount (within 5% tolerance)
      const dpAmount = Number(plan.downPayment);
      const dpPayment = planPayments.find(p => {
        if (matchedPayments.has(p.id)) return false;
        const amount = Number(p.amount);
        return amount >= dpAmount * 0.95 && amount <= dpAmount * 1.05;
      });
      
      if (dpPayment) {
        matchedPayments.add(dpPayment.id);
      }
      
      const dpVerified = !!dpPayment;
      
      checklist.push({
        id: `auto-dp-${plan.id}`,
        label: `Pembayaran DP`,
        completed: dpVerified,
        completedBy: dpVerified && dpPayment ? dpPayment.userId : null,
        completedAt: dpVerified && dpPayment && dpPayment.verifiedAt ? dpPayment.verifiedAt.toISOString() : null,
        order: order++,
      });
    }

    // Add installment checklist items if totalInstallments exists
    if (plan.totalInstallments && plan.totalInstallments > 0 && plan.installmentAmount) {
      const installmentAmount = Number(plan.installmentAmount);
      
      // Sort payments by period/date to match with installment numbers
      const sortedPayments = [...planPayments].sort((a, b) => {
        // Sort by period if available, otherwise by verifiedAt
        if (a.period && b.period) {
          return a.period.localeCompare(b.period);
        }
        const aDate = a.verifiedAt || a.createdAt;
        const bDate = b.verifiedAt || b.createdAt;
        return aDate.getTime() - bDate.getTime();
      });
      
      for (let i = 1; i <= plan.totalInstallments; i++) {
        // Find payment that matches installment amount (within 5% tolerance) and hasn't been matched
        const installmentPayment = sortedPayments.find(p => {
          if (matchedPayments.has(p.id)) return false;
          const amount = Number(p.amount);
          return amount >= installmentAmount * 0.95 && amount <= installmentAmount * 1.05;
        });
        
        if (installmentPayment) {
          matchedPayments.add(installmentPayment.id);
        }
        
        const installmentVerified = !!installmentPayment;
        
        checklist.push({
          id: `auto-installment-${plan.id}-${i}`,
          label: `Cicilan ke-${i}`,
          completed: installmentVerified,
          completedBy: installmentVerified && installmentPayment ? installmentPayment.userId : null,
          completedAt: installmentVerified && installmentPayment && installmentPayment.verifiedAt 
            ? installmentPayment.verifiedAt.toISOString() 
            : null,
          order: order++,
        });
      }
    }

    // Add cash payment checklist if paymentType is 'cash' or type is cash_keras/cash_bertahap
    if (plan.paymentType === 'cash' || plan.type === 'cash_keras' || plan.type === 'cash_bertahap') {
      const cashTotal = planPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const cashVerified = cashTotal >= Number(plan.totalAmount) * 0.95; // Allow 5% tolerance
      const lastCashPayment = planPayments.sort((a, b) => 
        (b.verifiedAt?.getTime() || 0) - (a.verifiedAt?.getTime() || 0)
      )[0];
      
      checklist.push({
        id: `auto-cash-${plan.id}`,
        label: `Pembayaran Cash`,
        completed: cashVerified,
        completedBy: cashVerified && lastCashPayment ? lastCashPayment.userId : null,
        completedAt: cashVerified && lastCashPayment && lastCashPayment.verifiedAt 
          ? lastCashPayment.verifiedAt.toISOString() 
          : null,
        order: order++,
      });
    }
  }

  // Generate completed members (members who have paid >= their totalAmount)
  const completedMembers: string[] = [];
  const memberPayments = new Map<string, number>();
  
  // Calculate total verified payments per member
  for (const payment of verifiedPayments) {
    const currentTotal = memberPayments.get(payment.userId) || 0;
    memberPayments.set(payment.userId, currentTotal + Number(payment.amount));
  }

  // Check each payment plan to see if member has completed their obligation
  for (const plan of paymentPlans) {
    const memberTotalPaid = memberPayments.get(plan.userId) || 0;
    if (memberTotalPaid >= Number(plan.totalAmount) * 0.95) { // Allow 5% tolerance
      if (!completedMembers.includes(plan.userId)) {
        completedMembers.push(plan.userId);
      }
    }
  }

  // Generate milestones based on percentage of total verified amount
  const milestones: any[] = [];
  const milestonePercentages = [25, 50, 100];
  let milestoneOrder = 0;

  // Sort verified payments by verifiedAt to find when milestones were reached
  const sortedPayments = [...verifiedPayments].sort((a, b) => 
    (a.verifiedAt?.getTime() || 0) - (b.verifiedAt?.getTime() || 0)
  );

  let cumulativeAmount = 0;
  const milestoneReached = new Map<number, Date>();

  for (const payment of sortedPayments) {
    cumulativeAmount += Number(payment.amount);
    const currentPercentage = (cumulativeAmount / totalRequired) * 100;

    for (const percentage of milestonePercentages) {
      if (currentPercentage >= percentage && !milestoneReached.has(percentage)) {
        milestoneReached.set(percentage, payment.verifiedAt || payment.createdAt);
      }
    }
  }

  // Create milestone entries
  for (const percentage of milestonePercentages) {
    const reachedDate = milestoneReached.get(percentage);
    const isCompleted = totalVerified >= (totalRequired * percentage / 100) * 0.95;
    
    let label = '';
    if (percentage === 100) {
      label = 'Pendanaan Grup Complete';
    } else {
      label = `${percentage}% Dana Terkumpul`;
    }

    milestones.push({
      id: `auto-milestone-${percentage}`,
      label,
      date: reachedDate ? reachedDate.toISOString() : null,
      status: isCompleted ? 'completed' as const : reachedDate ? 'pending' as const : 'upcoming' as const,
      order: milestoneOrder++,
    });
  }

  // Calculate progress
  const percentage = await calculateFundingProgress(projectId);

  return {
    checklist,
    completedMembers,
    milestones,
    percentage,
  };
}

