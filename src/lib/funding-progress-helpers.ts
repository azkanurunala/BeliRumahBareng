'use server';

import { db } from '@/lib/db';
import { calculateFundingProgress } from '@/lib/progress-calculator';

/**
 * Sync checklist items for Funding progress with verified payments
 * Creates checklist items in database if they don't exist, and syncs completions
 */
async function syncFundingChecklistItems(progressDetailId: string, projectId: string) {
  try {
    // Get all payment plans for the project
    const paymentPlans = await db.paymentPlan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    if (paymentPlans.length === 0) {
      return;
    }

    // Get all verified payments (status='paid' and verifiedAt IS NOT NULL)
    const verifiedPayments = await db.payment.findMany({
      where: {
        projectId,
        status: 'paid',
        verifiedAt: { not: null },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    // Group verified payments by paymentPlanId
    const paymentsByPlan = new Map<string, typeof verifiedPayments>();
    for (const payment of verifiedPayments) {
      const planKey = payment.paymentPlanId || 'no-plan';
      if (!paymentsByPlan.has(planKey)) {
        paymentsByPlan.set(planKey, []);
      }
      paymentsByPlan.get(planKey)!.push(payment);
    }

    let order = 0;
    const matchedPayments = new Set<string>();

    // Sync checklist items for each payment plan
    for (const plan of paymentPlans) {
      const planKey = plan.id;
      const planPayments = paymentsByPlan.get(planKey) || [];

      // Sync DP checklist item if downPayment exists
      if (plan.downPayment && Number(plan.downPayment) > 0) {
        const virtualId = `auto-dp-${plan.id}`;
        const label = `Pembayaran DP`;
        
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

        // Check if checklist item exists
        let checklistItem = await db.progressChecklistItem.findFirst({
          where: {
            progressDetailId,
            id: virtualId,
          },
          include: {
            completions: true,
          },
        });

        // Create if doesn't exist
        if (!checklistItem) {
          checklistItem = await db.progressChecklistItem.create({
            data: {
              id: virtualId,
              progressDetailId,
              label,
              order: order++,
            },
            include: {
              completions: true,
            },
          });
        } else {
          // Update label and order if changed
          if (checklistItem.label !== label || checklistItem.order !== order - 1) {
            await db.progressChecklistItem.update({
              where: { id: checklistItem.id },
              data: { label, order: order - 1 },
            });
          }
        }

        // Sync completion based on DP payment
        const currentCompletions = checklistItem.completions.map(c => c.userId);
        if (dpPayment) {
          // Add completion if payment exists and user not in completions
          if (!currentCompletions.includes(dpPayment.userId)) {
            await db.checklistItemCompletion.create({
              data: {
                checklistItemId: checklistItem.id,
                userId: dpPayment.userId,
                completedAt: dpPayment.verifiedAt || new Date(),
              },
            });
          }
        } else {
          // Remove all completions if payment doesn't exist
          if (currentCompletions.length > 0) {
            await db.checklistItemCompletion.deleteMany({
              where: {
                checklistItemId: checklistItem.id,
              },
            });
          }
        }
      }

      // Sync installment checklist items if totalInstallments exists
      if (plan.totalInstallments && plan.totalInstallments > 0 && plan.installmentAmount) {
        const installmentAmount = Number(plan.installmentAmount);
        
        // Sort payments by period/date to match with installment numbers
        const sortedPayments = [...planPayments].sort((a, b) => {
          if (a.period && b.period) {
            return a.period.localeCompare(b.period);
          }
          const aDate = a.verifiedAt || a.createdAt;
          const bDate = b.verifiedAt || b.createdAt;
          return aDate.getTime() - bDate.getTime();
        });
        
        for (let i = 1; i <= plan.totalInstallments; i++) {
          const virtualId = `auto-installment-${plan.id}-${i}`;
          const label = `Cicilan ke-${i}`;
          
          // Find payment that matches installment amount
          const installmentPayment = sortedPayments.find(p => {
            if (matchedPayments.has(p.id)) return false;
            const amount = Number(p.amount);
            return amount >= installmentAmount * 0.95 && amount <= installmentAmount * 1.05;
          });
          
          if (installmentPayment) {
            matchedPayments.add(installmentPayment.id);
          }

          // Check if checklist item exists
          let checklistItem = await db.progressChecklistItem.findFirst({
            where: {
              progressDetailId,
              id: virtualId,
            },
            include: {
              completions: true,
            },
          });

          // Create if doesn't exist
          if (!checklistItem) {
            checklistItem = await db.progressChecklistItem.create({
              data: {
                id: virtualId,
                progressDetailId,
                label,
                order: order++,
              },
              include: {
                completions: true,
              },
            });
          } else {
            // Update label and order if changed
            if (checklistItem.label !== label || checklistItem.order !== order - 1) {
              await db.progressChecklistItem.update({
                where: { id: checklistItem.id },
                data: { label, order: order - 1 },
              });
            }
          }

          // Sync completion based on installment payment
          const currentCompletions = checklistItem.completions.map(c => c.userId);
          if (installmentPayment) {
            // Add completion if payment exists and user not in completions
            if (!currentCompletions.includes(installmentPayment.userId)) {
              await db.checklistItemCompletion.create({
                data: {
                  checklistItemId: checklistItem.id,
                  userId: installmentPayment.userId,
                  completedAt: installmentPayment.verifiedAt || new Date(),
                },
              });
            }
          } else {
            // Remove all completions if payment doesn't exist
            if (currentCompletions.length > 0) {
              await db.checklistItemCompletion.deleteMany({
                where: {
                  checklistItemId: checklistItem.id,
                },
              });
            }
          }
        }
      }

      // Sync cash payment checklist if paymentType is 'cash' or type is cash_keras/cash_bertahap
      if (plan.paymentType === 'cash' || plan.type === 'cash_keras' || plan.type === 'cash_bertahap') {
        const virtualId = `auto-cash-${plan.id}`;
        const label = `Pembayaran Cash`;
        
        const cashTotal = planPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const cashVerified = cashTotal >= Number(plan.totalAmount) * 0.95; // Allow 5% tolerance
        const lastCashPayment = planPayments.sort((a, b) => 
          (b.verifiedAt?.getTime() || 0) - (a.verifiedAt?.getTime() || 0)
        )[0];

        // Check if checklist item exists
        let checklistItem = await db.progressChecklistItem.findFirst({
          where: {
            progressDetailId,
            id: virtualId,
          },
          include: {
            completions: true,
          },
        });

        // Create if doesn't exist
        if (!checklistItem) {
          checklistItem = await db.progressChecklistItem.create({
            data: {
              id: virtualId,
              progressDetailId,
              label,
              order: order++,
            },
            include: {
              completions: true,
            },
          });
        } else {
          // Update label and order if changed
          if (checklistItem.label !== label || checklistItem.order !== order - 1) {
            await db.progressChecklistItem.update({
              where: { id: checklistItem.id },
              data: { label, order: order - 1 },
            });
          }
        }

        // Sync completion based on cash payment
        const currentCompletions = checklistItem.completions.map(c => c.userId);
        if (cashVerified && lastCashPayment) {
          // Add completion if verified and user not in completions
          if (!currentCompletions.includes(lastCashPayment.userId)) {
            await db.checklistItemCompletion.create({
              data: {
                checklistItemId: checklistItem.id,
                userId: lastCashPayment.userId,
                completedAt: lastCashPayment.verifiedAt || new Date(),
              },
            });
          }
        } else {
          // Remove all completions if not verified
          if (currentCompletions.length > 0) {
            await db.checklistItemCompletion.deleteMany({
              where: {
                checklistItemId: checklistItem.id,
              },
            });
          }
        }
      }
    }

    // Remove checklist items for payment plans that no longer exist
    const existingChecklistItems = await db.progressChecklistItem.findMany({
      where: {
        progressDetailId,
        id: {
          startsWith: 'auto-',
        },
      },
    });

    const planIds = new Set(paymentPlans.map(p => p.id));
    for (const item of existingChecklistItems) {
      // Extract plan ID from virtual ID patterns
      // Patterns: auto-dp-${plan.id}, auto-installment-${plan.id}-${i}, auto-cash-${plan.id}
      let planId: string | null = null;
      if (item.id.startsWith('auto-dp-')) {
        planId = item.id.replace('auto-dp-', '');
      } else if (item.id.startsWith('auto-installment-')) {
        const match = item.id.match(/^auto-installment-(.+?)-/);
        planId = match ? match[1] : null;
      } else if (item.id.startsWith('auto-cash-')) {
        planId = item.id.replace('auto-cash-', '');
      }

      if (planId && !planIds.has(planId)) {
        // Payment plan no longer exists, delete checklist item
        await db.progressChecklistItem.delete({
          where: { id: item.id },
        });
      }
    }
  } catch (error) {
    console.error('Error syncing funding checklist items:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Generate funding progress data from payment plans and verified payments
 * Returns checklist, completedMembers, and milestones for funding category
 * Now syncs checklist items to database first
 */
export async function generateFundingProgressData(projectId: string) {
  // Get or create progress detail for Funding category
  let progressDetail = await db.progressDetail.findUnique({
    where: {
      projectId_category: {
        projectId,
        category: 'funding',
      },
    },
  });

  if (!progressDetail) {
    // Create progress detail if it doesn't exist
    progressDetail = await db.progressDetail.create({
      data: {
        projectId,
        category: 'funding',
        title: 'Pendanaan Grup',
        percentage: 0,
        description: 'Progress pembayaran terverifikasi',
      },
    });
  }

  // Sync checklist items to database
  await syncFundingChecklistItems(progressDetail.id, projectId);

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

  // Get checklist items from database (after sync)
  const checklistItems = await db.progressChecklistItem.findMany({
    where: {
      progressDetailId: progressDetail.id,
    },
    include: {
      completions: true,
    },
    orderBy: { order: 'asc' },
  });

  // Transform checklist items to match expected format
  const checklist = checklistItems.map((item) => ({
    id: item.id,
    label: item.label,
    completedMembers: item.completions.map(c => c.userId),
    order: item.order,
  }));

  // Completed members are now part of each checklist item, not at progress detail level
  const completedMembers: string[] = [];

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

