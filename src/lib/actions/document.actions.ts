'use server';

import { db } from '@/lib/db';
import { createProjectDocumentSchema, updateProjectDocumentSchema, createDocumentSignatureSchema, deleteDocumentSignatureSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Project Document Operations
 */

export async function createProjectDocument(data: z.infer<typeof createProjectDocumentSchema>) {
  try {
    // Validate input
    const validatedData = createProjectDocumentSchema.parse(data);

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      return {
        success: false,
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if uploader exists (if provided)
    if (validatedData.uploadedBy) {
      const uploader = await db.user.findUnique({
        where: { id: validatedData.uploadedBy },
      });

      if (!uploader) {
        return {
          success: false,
          error: {
            message: 'Uploader not found',
            code: 'NOT_FOUND',
          },
        };
      }
    }

    // Create project document
    const document = await db.projectDocument.create({
      data: {
        projectId: validatedData.projectId,
        name: validatedData.name,
        status: validatedData.status,
        url: validatedData.url || null,
        uploadDate: validatedData.uploadDate ? new Date(validatedData.uploadDate) : null,
        size: validatedData.size,
        description: validatedData.description || null,
        uploadedBy: validatedData.uploadedBy || null,
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        signatures: true,
      },
    });

    // Transform response
    const transformedDocument = {
      id: document.id,
      name: document.name,
      status: document.status as 'Menunggu' | 'Tertanda' | 'Terverifikasi',
      url: document.url,
      uploadDate: document.uploadDate?.toISOString(),
      size: document.size,
      description: document.description,
      uploadedBy: document.uploadedBy,
      signedBy: document.signatures.map((s) => s.userId),
      verifiedAt: document.verifiedAt?.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath(`/admin/projects/${validatedData.projectId}/documents`);
    revalidatePath('/admin/documents');
    revalidatePath('/api/project-documents');

    return {
      success: true,
      data: transformedDocument,
    };
  } catch (error) {
    console.error('Error creating project document:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to create project document',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updateProjectDocument(
  id: string,
  data: Partial<z.infer<typeof updateProjectDocumentSchema>>
) {
  try {
    // Check if document exists
    const existingDocument = await db.projectDocument.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: {
          message: 'Project document not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updateProjectDocumentSchema.parse({ ...data, id });

    // Update document
    const updateData: any = {};
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.url !== undefined) updateData.url = validatedData.url || null;
    if (validatedData.uploadDate !== undefined) updateData.uploadDate = validatedData.uploadDate ? new Date(validatedData.uploadDate) : null;
    if (validatedData.size !== undefined) updateData.size = validatedData.size;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.uploadedBy !== undefined) updateData.uploadedBy = validatedData.uploadedBy || null;
    if (validatedData.verifiedAt !== undefined) updateData.verifiedAt = validatedData.verifiedAt ? new Date(validatedData.verifiedAt) : null;

    const document = await db.projectDocument.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { signedAt: 'desc' },
        },
      },
    });

    // Transform response
    const transformedDocument = {
      id: document.id,
      name: document.name,
      status: document.status as 'Menunggu' | 'Tertanda' | 'Terverifikasi',
      url: document.url,
      uploadDate: document.uploadDate?.toISOString(),
      size: document.size,
      description: document.description,
      uploadedBy: document.uploadedBy,
      signedBy: document.signatures.map((s) => s.userId),
      verifiedAt: document.verifiedAt?.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${document.projectId}`);
    revalidatePath(`/admin/projects/${document.projectId}/documents`);
    revalidatePath('/admin/documents');
    revalidatePath('/api/project-documents');

    return {
      success: true,
      data: transformedDocument,
    };
  } catch (error) {
    console.error('Error updating project document:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to update project document',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deleteProjectDocument(id: string) {
  try {
    // Check if document exists
    const document = await db.projectDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return {
        success: false,
        error: {
          message: 'Project document not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete document (signatures will be deleted automatically due to cascade)
    await db.projectDocument.delete({
      where: { id },
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${document.projectId}`);
    revalidatePath(`/admin/projects/${document.projectId}/documents`);
    revalidatePath('/admin/documents');
    revalidatePath('/api/project-documents');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting project document:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete project document',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getProjectDocument(id: string) {
  try {
    const document = await db.projectDocument.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { signedAt: 'desc' },
        },
      },
    });

    if (!document) {
      return {
        success: false,
        error: {
          message: 'Project document not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform response
    const transformedDocument = {
      id: document.id,
      name: document.name,
      status: document.status as 'Menunggu' | 'Tertanda' | 'Terverifikasi',
      url: document.url,
      uploadDate: document.uploadDate?.toISOString(),
      size: document.size,
      description: document.description,
      uploadedBy: document.uploadedBy,
      signedBy: document.signatures.map((s) => s.userId),
      verifiedAt: document.verifiedAt?.toISOString(),
    };

    return {
      success: true,
      data: transformedDocument,
    };
  } catch (error) {
    console.error('Error fetching project document:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch project document',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getProjectDocuments(options?: {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: string;
  uploadedBy?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.status) where.status = options.status;
    if (options?.uploadedBy) where.uploadedBy = options.uploadedBy;

    // Get documents dengan pagination
    const [documents, total] = await Promise.all([
      db.projectDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              propertyName: true,
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              avatarHint: true,
            },
          },
          signatures: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { signedAt: 'desc' },
          },
        },
      }),
      db.projectDocument.count({ where }),
    ]);

    // Transform response
    const transformedDocuments = documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      status: doc.status as 'Menunggu' | 'Tertanda' | 'Terverifikasi',
      url: doc.url,
      uploadDate: doc.uploadDate?.toISOString(),
      size: doc.size,
      description: doc.description,
      uploadedBy: doc.uploadedBy,
      signedBy: doc.signatures.map((s) => s.userId),
      verifiedAt: doc.verifiedAt?.toISOString(),
    }));

    return {
      success: true,
      data: transformedDocuments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching project documents:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch project documents',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Document Signature Actions
export async function addDocumentSignature(data: z.infer<typeof createDocumentSignatureSchema>) {
  try {
    // Validate input
    const validatedData = createDocumentSignatureSchema.parse(data);

    // Check if document exists
    const document = await db.projectDocument.findUnique({
      where: { id: validatedData.documentId },
    });

    if (!document) {
      return {
        success: false,
        error: {
          message: 'Project document not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return {
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if already signed
    const existing = await db.documentSignature.findUnique({
      where: {
        documentId_userId: {
          documentId: validatedData.documentId,
          userId: validatedData.userId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          message: 'User has already signed this document',
          code: 'CONFLICT',
        },
      };
    }

    // Create signature
    const signature = await db.documentSignature.create({
      data: {
        documentId: validatedData.documentId,
        userId: validatedData.userId,
      },
    });

    // Update document status if needed (if all members signed, change to 'Tertanda')
    const project = await db.project.findUnique({
      where: { id: document.projectId },
      include: {
        members: true,
      },
    });

    if (project && project.members.length > 0) {
      const allSignatures = await db.documentSignature.findMany({
        where: { documentId: validatedData.documentId },
      });

      // If all project members have signed, update status to 'Tertanda'
      if (allSignatures.length >= project.members.length) {
        await db.projectDocument.update({
          where: { id: validatedData.documentId },
          data: { status: 'Tertanda' },
        });
      }
    }

    // Transform response
    const transformedSignature = {
      id: signature.id,
      documentId: signature.documentId,
      userId: signature.userId,
      signedAt: signature.signedAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${document.projectId}`);
    revalidatePath(`/admin/projects/${document.projectId}/documents`);
    revalidatePath('/admin/documents');
    revalidatePath('/api/project-documents');

    return {
      success: true,
      data: transformedSignature,
    };
  } catch (error) {
    console.error('Error adding document signature:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to add document signature',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function removeDocumentSignature(data: z.infer<typeof deleteDocumentSignatureSchema>) {
  try {
    // Validate input
    const validatedData = deleteDocumentSignatureSchema.parse(data);

    // Check if signature exists
    const signature = await db.documentSignature.findUnique({
      where: {
        documentId_userId: {
          documentId: validatedData.documentId,
          userId: validatedData.userId,
        },
      },
    });

    if (!signature) {
      return {
        success: false,
        error: {
          message: 'Document signature not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Get document before deletion
    const document = await db.projectDocument.findUnique({
      where: { id: validatedData.documentId },
    });

    // Delete signature
    await db.documentSignature.delete({
      where: {
        documentId_userId: {
          documentId: validatedData.documentId,
          userId: validatedData.userId,
        },
      },
    });

    // Update document status if needed (if not all members signed, change back to 'Menunggu')
    if (document) {
      const project = await db.project.findUnique({
        where: { id: document.projectId },
        include: {
          members: true,
        },
      });

      if (project && project.members.length > 0) {
        const allSignatures = await db.documentSignature.findMany({
          where: { documentId: validatedData.documentId },
        });

        // If not all members have signed, update status to 'Menunggu'
        if (allSignatures.length < project.members.length) {
          await db.projectDocument.update({
            where: { id: validatedData.documentId },
            data: { status: 'Menunggu' },
          });
        }
      }
    }

    revalidatePath('/admin/projects');
    if (document) {
      revalidatePath(`/admin/projects/${document.projectId}`);
      revalidatePath(`/admin/projects/${document.projectId}/documents`);
    }
    revalidatePath('/admin/documents');
    revalidatePath('/api/project-documents');

    return {
      success: true,
      data: { documentId: validatedData.documentId, userId: validatedData.userId },
    };
  } catch (error) {
    console.error('Error removing document signature:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to remove document signature',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getDocumentSignatures(documentId: string) {
  try {
    // Check if document exists
    const document = await db.projectDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return {
        success: false,
        error: {
          message: 'Project document not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Get signatures
    const signatures = await db.documentSignature.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Transform response
    const transformedSignatures = signatures.map((sig) => ({
      id: sig.id,
      documentId: sig.documentId,
      userId: sig.userId,
      signedAt: sig.signedAt.toISOString(),
    }));

    return {
      success: true,
      data: transformedSignatures,
    };
  } catch (error) {
    console.error('Error fetching document signatures:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch document signatures',
        code: 'FETCH_ERROR',
      },
    };
  }
}

