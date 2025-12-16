import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProjectDocumentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/project-documents - Get all project documents dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId') || '';
    const status = searchParams.get('status') || '';
    const uploadedBy = searchParams.get('uploadedBy') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (uploadedBy) where.uploadedBy = uploadedBy;

    // Get project documents dengan pagination
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

    // Transform ke format yang diharapkan frontend
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

    return NextResponse.json({
      success: true,
      data: transformedDocuments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch project documents',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/project-documents - Create new project document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createProjectDocumentSchema.parse(body);

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if uploader exists (if provided)
    if (validatedData.uploadedBy) {
      const uploader = await db.user.findUnique({
        where: { id: validatedData.uploadedBy },
      });

      if (!uploader) {
        throw new NotFoundError('Uploader not found');
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

    return NextResponse.json(
      {
        success: true,
        data: transformedDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project document:', error);

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
          message: 'Failed to create project document',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








