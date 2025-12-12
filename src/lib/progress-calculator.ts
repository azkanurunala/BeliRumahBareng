'use server';

import { db } from '@/lib/db';

/**
 * Calculate KYC Progress based on checklist items and completed members
 * Formula: (completedChecklist / totalChecklist * 0.6 + completedMembers / totalMembers * 0.4) * 100
 */
export async function calculateKYCProgress(projectId: string): Promise<number> {
  try {
    // Get KYC progress detail
    const kycDetail = await db.progressDetail.findUnique({
      where: {
        projectId_category: {
          projectId,
          category: 'kyc',
        },
      },
      include: {
        checklist: true,
        completedMembers: true,
      },
    });

    if (!kycDetail) {
      return 0;
    }

    // Calculate checklist progress (60% weight)
    const totalChecklist = kycDetail.checklist.length;
    const completedChecklist = kycDetail.checklist.filter(item => item.completed).length;
    const checklistProgress = totalChecklist > 0 
      ? (completedChecklist / totalChecklist) * 0.6 
      : 0;

    // Calculate members progress (40% weight)
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
    const completedMembers = kycDetail.completedMembers.length;
    const membersProgress = totalMembers > 0 
      ? (completedMembers / totalMembers) * 0.4 
      : 0;

    // Combine with weighted average
    const totalProgress = (checklistProgress + membersProgress) * 100;
    return Math.round(Math.min(100, Math.max(0, totalProgress)));
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
 * Calculate Legal Progress based on verified documents vs total documents
 * Formula: (verifiedDocuments / totalDocuments) * 100
 */
export async function calculateLegalProgress(projectId: string): Promise<number> {
  try {
    // Get all documents for the project
    const documents = await db.projectDocument.findMany({
      where: { projectId },
    });

    if (documents.length === 0) {
      return 0;
    }

    // Count verified documents (status='Terverifikasi')
    const verifiedDocuments = documents.filter(doc => doc.status === 'Terverifikasi').length;

    // Calculate progress
    const progress = (verifiedDocuments / documents.length) * 100;
    return Math.round(Math.min(100, Math.max(0, progress)));
  } catch (error) {
    console.error('Error calculating legal progress:', error);
    return 0;
  }
}

/**
 * Calculate Closing Progress based on completed milestones vs total milestones
 * Formula: (completedMilestones / totalMilestones) * 100
 */
export async function calculateClosingProgress(projectId: string): Promise<number> {
  try {
    // Get closing progress detail
    const closingDetail = await db.progressDetail.findUnique({
      where: {
        projectId_category: {
          projectId,
          category: 'closing',
        },
      },
      include: {
        milestones: true,
      },
    });

    if (!closingDetail) {
      return 0;
    }

    const totalMilestones = closingDetail.milestones.length;
    if (totalMilestones === 0) {
      return 0;
    }

    // Count completed milestones (status='completed')
    const completedMilestones = closingDetail.milestones.filter(
      milestone => milestone.status === 'completed'
    ).length;

    // Calculate progress
    const progress = (completedMilestones / totalMilestones) * 100;
    return Math.round(Math.min(100, Math.max(0, progress)));
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

