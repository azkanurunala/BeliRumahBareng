import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviewPropertyInterestSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { createProject } from '@/lib/actions/project.actions';
import { addProjectMember } from '@/lib/actions/project.actions';

// POST /api/property-interests/[id]/review - Review property interest (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = reviewPropertyInterestSchema.parse({ ...body, id });

    // Check if interest exists
    const interest = await db.propertyInterest.findUnique({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundError('Property interest not found');
    }

    // Check if reviewer exists
    const reviewer = await db.user.findUnique({
      where: { id: validatedData.reviewedBy },
    });

    if (!reviewer) {
      throw new NotFoundError('Reviewer not found');
    }

    // Get property info dengan images untuk project creation
    const property = await db.property.findUnique({
      where: { id: interest.propertyId },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Update interest dengan review
    const updatedInterest = await db.propertyInterest.update({
      where: { id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes || interest.notes,
        reviewedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedInterest = {
      id: updatedInterest.id,
      propertyId: updatedInterest.propertyId,
      userId: updatedInterest.userId,
      unitId: updatedInterest.unitId,
      unitSize: updatedInterest.unitSize ? Number(updatedInterest.unitSize) : undefined,
      isFirstHome: updatedInterest.isFirstHome,
      willOccupy: updatedInterest.willOccupy,
      email: updatedInterest.email,
      phoneNumber: updatedInterest.phoneNumber,
      status: updatedInterest.status as 'pending' | 'approved' | 'rejected' | undefined,
      notes: updatedInterest.notes,
      reviewedAt: updatedInterest.reviewedAt?.toISOString(),
      createdAt: updatedInterest.createdAt.toISOString(),
    };

    // Jika interest di-approve, buat project dan tambahkan user sebagai member
    if (validatedData.status === 'approved') {
      // Cek apakah sudah ada project untuk property ini
      let existingProject = await db.project.findFirst({
        where: { propertyId: interest.propertyId },
      });

      // Jika belum ada project, buat project baru
      if (!existingProject) {
        const firstImage = property.images[0];
        const projectResult = await createProject({
          propertyId: property.id,
          propertyName: property.name,
          propertyImageUrl: firstImage?.url || '',
          propertyImageHint: firstImage?.hint || property.name,
          status: 'active',
          kycProgress: 0,
          fundingProgress: 0,
          legalProgress: 0,
          closingProgress: 0,
        });

        if (!projectResult.success || !projectResult.data) {
          console.error('Failed to create project:', projectResult.error);
          // Tetap lanjutkan proses meskipun project creation gagal
        } else {
          existingProject = { id: projectResult.data.id } as { id: string };
        }
      }

      // Tambahkan user sebagai projectMember jika project berhasil dibuat/ditemukan
      if (existingProject) {
        // Cek apakah user sudah menjadi member
        const existingMember = await db.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: existingProject.id,
              userId: interest.userId,
            },
          },
        });

        // Jika belum menjadi member, tambahkan
        if (!existingMember) {
          const memberResult = await addProjectMember({
            projectId: existingProject.id,
            userId: interest.userId,
          });

          if (!memberResult.success) {
            console.error('Failed to add project member:', memberResult.error);
            // Tetap lanjutkan proses meskipun add member gagal
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedInterest,
    });
  } catch (error) {
    console.error('Error reviewing property interest:', error);

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
          message: 'Failed to review property interest',
          code: 'REVIEW_ERROR',
        },
      },
      { status: 500 }
    );
  }
}



