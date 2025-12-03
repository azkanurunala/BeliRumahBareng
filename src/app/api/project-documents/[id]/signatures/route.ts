import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDocumentSignatureSchema, deleteDocumentSignatureSchema } from '@/lib/validations';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/project-documents/[id]/signatures - Get all signatures for a document
export async function GET(
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

    // Get signatures
    const signatures = await db.documentSignature.findMany({
      where: { documentId: id },
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

    return NextResponse.json({
      success: true,
      data: transformedSignatures,
    });
  } catch (error) {
    console.error('Error fetching document signatures:', error);

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
          message: 'Failed to fetch document signatures',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/project-documents/[id]/signatures - Add signature to document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createDocumentSignatureSchema.parse({ ...body, documentId: id });

    // Check if document exists
    const document = await db.projectDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Project document not found');
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
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
      throw new ConflictError('User has already signed this document');
    }

    // Create signature
    const signature = await db.documentSignature.create({
      data: {
        documentId: validatedData.documentId,
        userId: validatedData.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update document status if needed (if all members signed, change to 'Tertanda')
    const project = await db.project.findUnique({
      where: { id: document.projectId },
      include: {
        members: true,
      },
    });

    if (project) {
      const allSignatures = await db.documentSignature.findMany({
        where: { documentId: validatedData.documentId },
      });

      // If all project members have signed, update status to 'Tertanda'
      if (project.members.length > 0 && allSignatures.length >= project.members.length) {
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

    return NextResponse.json(
      {
        success: true,
        data: transformedSignature,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating document signature:', error);

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

    if (error instanceof ConflictError) {
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
          message: 'Failed to create document signature',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/project-documents/[id]/signatures - Remove signature from document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'userId is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Validate input
    const validatedData = deleteDocumentSignatureSchema.parse({
      documentId: id,
      userId,
    });

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
      throw new NotFoundError('Document signature not found');
    }

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
    const document = await db.projectDocument.findUnique({
      where: { id: validatedData.documentId },
    });

    if (document) {
      const project = await db.project.findUnique({
        where: { id: document.projectId },
        include: {
          members: true,
        },
      });

      if (project) {
        const allSignatures = await db.documentSignature.findMany({
          where: { documentId: validatedData.documentId },
        });

        // If not all members have signed, update status to 'Menunggu'
        if (project.members.length > 0 && allSignatures.length < project.members.length) {
          await db.projectDocument.update({
            where: { id: validatedData.documentId },
            data: { status: 'Menunggu' },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { documentId: validatedData.documentId, userId: validatedData.userId },
    });
  } catch (error) {
    console.error('Error deleting document signature:', error);

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
          message: 'Failed to delete document signature',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

