'use server';

import { db } from '@/lib/db';
import { calculateLegalProgress } from '@/lib/progress-calculator';

/**
 * Generate legal progress data from document signatures
 * Returns checklist, completedMembers, and milestones for legal category
 */
export async function generateLegalProgressData(projectId: string) {
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

  // Generate checklist items
  const checklist = documents.map((doc, index) => {
    const docSignatures = signaturesByDocument.get(doc.id) || [];
    const allMembersSigned = docSignatures.length >= members.length;
    const lastSignature = docSignatures[0]; // Already sorted desc

    return {
      id: `auto-${doc.id}`, // Virtual ID
      label: `Penandatanganan ${doc.name}`,
      completed: allMembersSigned,
      completedBy: allMembersSigned && lastSignature ? lastSignature.userId : null,
      completedAt: allMembersSigned && lastSignature ? lastSignature.signedAt.toISOString() : null,
      order: index,
    };
  });

  // Generate completed members (members who signed all documents)
  const completedMembers: string[] = [];
  for (const member of members) {
    const memberSignatures = allSignatures.filter(sig => sig.userId === member.userId);
    const signedDocumentIds = new Set(memberSignatures.map(s => s.documentId));
    const hasSignedAll = documents.every(doc => signedDocumentIds.has(doc.id));
    
    if (hasSignedAll) {
      completedMembers.push(member.userId);
    }
  }

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
        id: `auto-${doc.id}`, // Virtual ID
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

