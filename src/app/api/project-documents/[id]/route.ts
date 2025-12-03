import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProjectDocumentSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/project-documents/[id] - Get project document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      throw new NotFoundError('Project document not found');
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

    return NextResponse.json({
      success: true,
      data: transformedDocument,
    });
  } catch (error) {
    console.error('Error fetching project document:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch project document',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/project-documents/[id] - Update project document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if document exists
    const existingDocument = await db.projectDocument.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new NotFoundError('Project document not found');
    }

    // Validate input dengan ID
    const validatedData = updateProjectDocumentSchema.parse({ ...body, id });

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

    return NextResponse.json({
      success: true,
      data: transformedDocument,
    });
  } catch (error) {
    console.error('Error updating project document:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            errors: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update project document',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/project-documents/[id] - Delete project document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if document exists
    const document = await db.projectDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Project document not found');
    }

    // Delete document (signatures will be deleted automatically due to cascade)
    await db.projectDocument.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting project document:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to delete project document',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

