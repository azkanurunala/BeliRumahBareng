'use server';

import { db } from '@/lib/db';
import { calculateLegalProgress } from '@/lib/progress-calculator';

/**
 * Sync checklist items for Legal progress with document signatures
 * Creates checklist items in database if they don't exist, and syncs completions
 */
async function syncLegalChecklistItems(progressDetailId: string, projectId: string) {
  try {
    // Get all documents for the project
    const documents = await db.projectDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    // Get all project members
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return;
    }

    const members = project.members;
    const memberIds = new Set(members.map(m => m.userId));

    // Get all signatures for all documents
    const allSignatures = await db.documentSignature.findMany({
      where: {
        document: {
          projectId: projectId,
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Group signatures by documentId
    const signaturesByDocument = new Map<string, typeof allSignatures>();
    for (const sig of allSignatures) {
      if (!signaturesByDocument.has(sig.documentId)) {
        signaturesByDocument.set(sig.documentId, []);
      }
      signaturesByDocument.get(sig.documentId)!.push(sig);
    }

    // Sync checklist items for each document
    for (let index = 0; index < documents.length; index++) {
      const doc = documents[index];
      const virtualId = `auto-${doc.id}`;
      const label = `Penandatanganan ${doc.name}`;
      
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
            id: virtualId, // Use virtual ID as actual ID
            progressDetailId,
            label,
            order: index,
          },
          include: {
            completions: true,
          },
        });
      } else {
        // Update label if document name changed
        if (checklistItem.label !== label) {
          await db.progressChecklistItem.update({
            where: { id: checklistItem.id },
            data: { label },
          });
        }
      }

      // Sync completions based on document signatures
      const docSignatures = signaturesByDocument.get(doc.id) || [];
      const signedUserIds = new Set(docSignatures.map(sig => sig.userId));
      
      // Get current completions
      const currentCompletions = checklistItem.completions.map(c => c.userId);
      const currentCompletionSet = new Set(currentCompletions);

      // Add completions for users who signed
      for (const userId of signedUserIds) {
        if (!currentCompletionSet.has(userId)) {
          // User signed but not in completions - add it
          await db.checklistItemCompletion.create({
            data: {
              checklistItemId: checklistItem.id,
              userId,
              completedAt: docSignatures.find(s => s.userId === userId)?.signedAt || new Date(),
            },
          });
        }
      }

      // Remove completions for users who didn't sign
      for (const userId of currentCompletions) {
        if (!signedUserIds.has(userId)) {
          // User in completions but didn't sign - remove it
          await db.checklistItemCompletion.deleteMany({
            where: {
              checklistItemId: checklistItem.id,
              userId,
            },
          });
        }
      }
    }

    // Remove checklist items for documents that no longer exist
    const existingChecklistItems = await db.progressChecklistItem.findMany({
      where: {
        progressDetailId,
        id: {
          startsWith: 'auto-',
        },
      },
    });

    const documentIds = new Set(documents.map(d => d.id));
    for (const item of existingChecklistItems) {
      // Extract document ID from virtual ID (auto-${doc.id})
      const docId = item.id.replace('auto-', '');
      if (!documentIds.has(docId)) {
        // Document no longer exists, delete checklist item
        await db.progressChecklistItem.delete({
          where: { id: item.id },
        });
      }
    }
  } catch (error) {
    console.error('Error syncing legal checklist items:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Generate legal progress data from document signatures
 * Returns checklist, completedMembers, and milestones for legal category
 * Now syncs checklist items to database first
 */
export async function generateLegalProgressData(projectId: string) {
  // Get or create progress detail for Legal category
  let progressDetail = await db.progressDetail.findUnique({
    where: {
      projectId_category: {
        projectId,
        category: 'legal',
      },
    },
  });

  if (!progressDetail) {
    // Create progress detail if it doesn't exist
    progressDetail = await db.progressDetail.create({
      data: {
        projectId,
        category: 'legal',
        title: 'Legal & Dokumentasi',
        percentage: 0,
        description: 'Progress penandatanganan dokumen legal',
      },
    });
  }

  // Sync checklist items to database
  await syncLegalChecklistItems(progressDetail.id, projectId);

  // Get all documents for the project
  const documents = await db.projectDocument.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  // Get all project members
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: true,
    },
  });

  if (!project) {
    return {
      checklist: [],
      completedMembers: [],
      milestones: [],
      percentage: 0,
    };
  }

  const members = project.members;
  const memberIds = new Set(members.map(m => m.userId));

  // Get all signatures for all documents
  const allSignatures = await db.documentSignature.findMany({
    where: {
      document: {
        projectId: projectId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { signedAt: 'desc' },
  });

  // Group signatures by documentId
  const signaturesByDocument = new Map<string, typeof allSignatures>();
  for (const sig of allSignatures) {
    if (!signaturesByDocument.has(sig.documentId)) {
      signaturesByDocument.set(sig.documentId, []);
    }
    signaturesByDocument.get(sig.documentId)!.push(sig);
  }

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

  // Generate milestones (documents that are fully signed)
  const milestones = documents
    .map((doc, index) => {
      const docSignatures = signaturesByDocument.get(doc.id) || [];
      const allMembersSigned = docSignatures.length >= members.length;
      
      if (!allMembersSigned) {
        return null;
      }

      const lastSignature = docSignatures[0]; // Already sorted desc
      
      return {
        id: `auto-${doc.id}`, // Virtual ID for milestone
        label: `Dokumen ${doc.name} telah ditandatangani oleh semua anggota`,
        date: lastSignature.signedAt.toISOString(),
        status: 'completed' as const,
        order: index,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  // Calculate progress
  const percentage = await calculateLegalProgress(projectId);

  return {
    checklist,
    completedMembers,
    milestones,
    percentage,
  };
}

