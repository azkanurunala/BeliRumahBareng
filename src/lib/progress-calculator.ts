'use server';

import { db } from '@/lib/db';
import { calculateChecklistItemProgress, calculateOverallProgressFromChecklistItems } from '@/lib/checklist-helpers';

/**
 * Calculate KYC Progress based on checklist items with multiple members per item
 * Formula per item: (jumlah anggota yang selesai / total anggota) × 100
 * Formula total: rata-rata dari semua checklist items
 */
export async function calculateKYCProgress(projectId: string): Promise<number> {
  try {
    // Get KYC progress detail with checklist items and their completions
    const kycDetail = await db.progressDetail.findUnique({
      where: {
        projectId_category: {
          projectId,
          category: 'kyc',
        },
      },
      include: {
        checklist: {
          include: {
            completions: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!kycDetail) {
      return 0;
    }

    const totalChecklist = kycDetail.checklist.length;
    if (totalChecklist === 0) {
      return 0;
    }

    // Get all project members
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return 0;
    }

    const totalMembers = project.members.length;
    if (totalMembers === 0) {
      return 0;
    }

    // Calculate progress for each checklist item
    const itemProgresses = kycDetail.checklist.map(item => {
      const completedMembersCount = item.completions.length;
      return calculateChecklistItemProgress(completedMembersCount, totalMembers);
    });

    // Calculate overall progress as average of all item progresses
    return calculateOverallProgressFromChecklistItems(itemProgresses);
  } catch (error) {
    console.error('Error calculating KYC progress:', error);
    return 0;
  }
}

/**
 * Calculate Funding Progress based on verified payments vs total required amount
 * Formula: (totalVerifiedPayments / totalRequiredAmount) * 100
 */
export async function calculateFundingProgress(projectId: string): Promise<number> {
  try {
    // Get all payment plans for the project
    const paymentPlans = await db.paymentPlan.findMany({
      where: { projectId },
    });

    if (paymentPlans.length === 0) {
      return 0;
    }

    // Calculate total required amount
    const totalRequired = paymentPlans.reduce((sum, plan) => {
      return sum + Number(plan.totalAmount);
    }, 0);

    if (totalRequired === 0) {
      return 0;
    }

    // Get all verified payments (status='paid' and verifiedAt IS NOT NULL)
    const verifiedPayments = await db.payment.findMany({
      where: {
        projectId,
        status: 'paid',
        verifiedAt: { not: null },
      },
    });

    // Calculate total paid amount
    const totalPaid = verifiedPayments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    // Calculate progress
    const progress = (totalPaid / totalRequired) * 100;
    return Math.round(Math.min(100, Math.max(0, progress)));
  } catch (error) {
    console.error('Error calculating funding progress:', error);
    return 0;
  }
}

/**
 * Calculate Legal Progress based on document signatures vs total target
 * Formula: (jumlah penandatanganan yang sudah dilakukan) / (total dokumen × total anggota) × 100
 */
export async function calculateLegalProgress(projectId: string): Promise<number> {
  try {
    // Get all documents for the project
    const documents = await db.projectDocument.findMany({
      where: { projectId },
    });

    // Get all project members
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project || documents.length === 0 || project.members.length === 0) {
      return 0;
    }

    // Calculate total target: total documents × total members
    const totalTarget = documents.length * project.members.length;

    if (totalTarget === 0) {
      return 0;
    }

    // Count all signatures for all documents in this project
    const allSignatures = await db.documentSignature.findMany({
      where: {
        document: {
          projectId: projectId,
        },
      },
    });

    const completedSignatures = allSignatures.length;

    // Calculate progress: (completed signatures / total target) × 100
    const progress = (completedSignatures / totalTarget) * 100;
    return Math.round(Math.min(100, Math.max(0, progress)));
  } catch (error) {
    console.error('Error calculating legal progress:', error);
    return 0;
  }
}

/**
 * Calculate Closing Progress based on checklist items with multiple members per item
 * Formula per item: (jumlah anggota yang selesai / total anggota) × 100
 * Formula total: rata-rata dari semua checklist items
 */
export async function calculateClosingProgress(projectId: string): Promise<number> {
  try {
    // Get closing progress detail with checklist items and their completions
    const closingDetail = await db.progressDetail.findUnique({
      where: {
        projectId_category: {
          projectId,
          category: 'closing',
        },
      },
      include: {
        checklist: {
          include: {
            completions: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!closingDetail) {
      return 0;
    }

    const totalChecklist = closingDetail.checklist.length;
    if (totalChecklist === 0) {
      return 0;
    }

    // Get all project members
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return 0;
    }

    const totalMembers = project.members.length;
    if (totalMembers === 0) {
      return 0;
    }

    // Calculate progress for each checklist item
    const itemProgresses = closingDetail.checklist.map(item => {
      const completedMembersCount = item.completions.length;
      return calculateChecklistItemProgress(completedMembersCount, totalMembers);
    });

    // Calculate overall progress as average of all item progresses
    return calculateOverallProgressFromChecklistItems(itemProgresses);
  } catch (error) {
    console.error('Error calculating closing progress:', error);
    return 0;
  }
}

/**
 * Calculate all progress values at once
 * Returns object with kyc, funding, legal, and closing progress
 */
export async function calculateAllProgress(projectId: string): Promise<{
  kyc: number;
  funding: number;
  legal: number;
  closing: number;
}> {
  try {
    const [kyc, funding, legal, closing] = await Promise.all([
      calculateKYCProgress(projectId),
      calculateFundingProgress(projectId),
      calculateLegalProgress(projectId),
      calculateClosingProgress(projectId),
    ]);

    return { kyc, funding, legal, closing };
  } catch (error) {
    console.error('Error calculating all progress:', error);
    return { kyc: 0, funding: 0, legal: 0, closing: 0 };
  }
}

/**
 * Auto-generate milestone from checklist item completion
 * Creates a milestone with label "{checklist.label} Selesai" when all members complete the item
 */
export async function autoGenerateMilestoneFromChecklist(
  progressDetailId: string,
  checklistItemId: string
): Promise<void> {
  try {
    // Get checklist item with completions
    const checklistItem = await db.progressChecklistItem.findUnique({
      where: { id: checklistItemId },
      include: {
        progressDetail: {
          include: {
            project: {
              include: {
                members: true,
              },
            },
          },
        },
        completions: {
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!checklistItem || !checklistItem.progressDetail) {
      return;
    }

    const totalMembers = checklistItem.progressDetail.project.members.length;
    const completedMembersCount = checklistItem.completions.length;

    // Only generate milestone if all members have completed this item
    if (totalMembers === 0 || completedMembersCount < totalMembers) {
      return;
    }

    // Get the latest completion date (when the last member completed)
    const latestCompletion = checklistItem.completions[0];
    if (!latestCompletion) {
      return;
    }

    // Generate milestone label
    const milestoneLabel = `${checklistItem.label} Selesai`;

    // Check if milestone with similar label already exists
    const existingMilestones = await db.progressMilestone.findMany({
      where: {
        progressDetailId,
        label: {
          contains: checklistItem.label,
        },
      },
    });

    // If milestone already exists, skip
    if (existingMilestones.length > 0) {
      return;
    }

    // Get max order for milestones
    const maxOrderMilestone = await db.progressMilestone.findFirst({
      where: { progressDetailId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = maxOrderMilestone ? maxOrderMilestone.order + 1 : 0;

    // Create milestone
    await db.progressMilestone.create({
      data: {
        progressDetailId,
        label: milestoneLabel,
        date: latestCompletion.completedAt,
        status: 'completed',
        order: nextOrder,
      },
    });
  } catch (error) {
    console.error('Error auto-generating milestone from checklist:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Auto-generate default checklist items for a progress detail
 * Only generates for KYC and Closing categories
 */
export async function generateDefaultChecklistItems(progressDetailId: string, category: string): Promise<void> {
  try {
    // Only generate for KYC and Closing
    if (category !== 'kyc' && category !== 'closing') {
      return;
    }

    // Check if checklist items already exist
    const existingChecklist = await db.progressChecklistItem.findMany({
      where: { progressDetailId },
    });

    // If checklist items already exist, don't generate
    if (existingChecklist.length > 0) {
      return;
    }

    // Import getDefaultChecklistItems from helper file
    const { getDefaultChecklistItems } = await import('@/lib/checklist-helpers');
    
    // Get default checklist items
    const defaultItems = getDefaultChecklistItems(category as 'kyc' | 'closing');

    // Create checklist items
    await db.progressChecklistItem.createMany({
      data: defaultItems.map(item => ({
        progressDetailId,
        label: item.label,
        order: item.order,
        // completed field removed - no longer exists in schema after migration to ChecklistItemCompletion
      })),
    });
  } catch (error) {
    console.error('Error generating default checklist items:', error);
    // Don't throw - this is a background operation
  }
}

