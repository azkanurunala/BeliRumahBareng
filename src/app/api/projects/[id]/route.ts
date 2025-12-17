import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProjectSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/projects/[id] - Get project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Force fresh data from database, no cache
  const { unstable_noStore } = await import('next/cache');
  unstable_noStore();
  
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: {
              orderBy: { order: 'asc' },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                avatarUrl: true,
                avatarHint: true,
                locationPreference: true,
                priceRange: true,
                investmentGoals: true,
                financialCapacity: true,
                timeHorizon: true,
              },
            },
          },
        },
        unitAssignments: {
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
        },
        progressDetails: {
          include: {
            checklist: {
              orderBy: { order: 'asc' },
            },
            completedMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            milestones: {
              orderBy: { order: 'asc' },
            },
          },
        },
        documents: {
          include: {
            signatures: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        paymentPlans: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Transform progress details
    const progressDetailsMap: Record<string, any> = {};
    project.progressDetails.forEach((pd) => {
      progressDetailsMap[pd.category] = {
        title: pd.title,
        percentage: pd.percentage,
        description: pd.description,
        notes: pd.notes,
        checklist: pd.checklist.map((item) => ({
          id: item.id,
          label: item.label,
          completed: item.completed,
          completedBy: item.completedBy,
          completedAt: item.completedAt?.toISOString(),
        })),
        completedMembers: pd.completedMembers.map((cm) => cm.userId),
        milestones: pd.milestones.map((m) => ({
          label: m.label,
          date: m.date?.toISOString(),
          status: m.status,
        })),
      };
    });

    // Transform messages
    const messages = project.messages.map((msg) => ({
      userId: msg.userId,
      message: msg.message,
      timestamp: msg.createdAt.toISOString(),
    }));

    // Transform payment plans
    const installmentPlans = project.paymentPlans.map((plan) => ({
      id: plan.id,
      projectId: plan.projectId,
      userId: plan.userId,
      unitId: plan.unitId,
      totalAmount: Number(plan.totalAmount),
      downPayment: plan.downPayment ? Number(plan.downPayment) : undefined,
      installmentAmount: plan.installmentAmount ? Number(plan.installmentAmount) : undefined,
      totalInstallments: plan.totalInstallments,
      startDate: plan.startDate?.toISOString(),
      endDate: plan.endDate?.toISOString(),
      status: plan.status,
      payments: plan.payments.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        userId: p.userId,
        unitId: p.unitId,
        amount: Number(p.amount),
        paymentDate: p.paymentDate?.toISOString(),
        dueDate: p.dueDate?.toISOString(),
        period: p.period,
        status: p.status,
        paymentMethod: p.paymentMethod,
        receiptUrl: p.receiptUrl,
        paymentReference: p.paymentReference,
        notes: p.notes,
        verifiedBy: p.verifiedBy,
        verifiedAt: p.verifiedAt?.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
    }));

    // Transform ke format yang diharapkan frontend
    const transformedProject = {
      id: project.id,
      propertyId: project.propertyId,
      propertyName: project.propertyName,
      propertyImageUrl: project.propertyImageUrl,
      propertyImageHint: project.propertyImageHint,
      status: project.status as 'active' | 'closed' | 'completed' | undefined,
      progress: {
        kyc: project.kycProgress,
        funding: project.fundingProgress,
        legal: project.legalProgress,
        closing: project.closingProgress,
      },
      progressDetails: {
        kyc: progressDetailsMap.kyc || { title: 'KYC', percentage: 0, checklist: [], completedMembers: [] },
        funding: progressDetailsMap.funding || { title: 'Funding', percentage: 0, checklist: [], completedMembers: [] },
        legal: progressDetailsMap.legal || { title: 'Legal', percentage: 0, checklist: [], completedMembers: [] },
        closing: progressDetailsMap.closing || { title: 'Closing', percentage: 0, checklist: [], completedMembers: [] },
      },
      members: project.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phoneNumber: m.user.phoneNumber,
        avatarUrl: m.user.avatarUrl,
        avatarHint: m.user.avatarHint,
        profile: {
          locationPreference: m.user.locationPreference,
          priceRange: m.user.priceRange,
          investmentGoals: m.user.investmentGoals,
          financialCapacity: m.user.financialCapacity,
          timeHorizon: m.user.timeHorizon,
        },
      })),
      unitAssignments: project.unitAssignments.map((ua) => ({
        unitId: ua.unitId,
        userId: ua.userId,
        price: Number(ua.price),
        size: ua.size ? Number(ua.size) : undefined,
      })),
      documents: project.documents.map((doc) => ({
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
      })),
      messages,
      installmentPlans,
    };

    return NextResponse.json({
      success: true,
      data: transformedProject,
    });
  } catch (error) {
    console.error('Error fetching project:', error);

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
          message: 'Failed to fetch project',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Validate input dengan ID
    const validatedData = updateProjectSchema.parse({ ...body, id });

    // Update project
    const updateData: any = {};
    if (validatedData.propertyId !== undefined) updateData.propertyId = validatedData.propertyId;
    if (validatedData.propertyName !== undefined) updateData.propertyName = validatedData.propertyName;
    if (validatedData.propertyImageUrl !== undefined) updateData.propertyImageUrl = validatedData.propertyImageUrl;
    if (validatedData.propertyImageHint !== undefined) updateData.propertyImageHint = validatedData.propertyImageHint;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.kycProgress !== undefined) updateData.kycProgress = validatedData.kycProgress;
    if (validatedData.fundingProgress !== undefined) updateData.fundingProgress = validatedData.fundingProgress;
    if (validatedData.legalProgress !== undefined) updateData.legalProgress = validatedData.legalProgress;
    if (validatedData.closingProgress !== undefined) updateData.closingProgress = validatedData.closingProgress;

    const project = await db.project.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        members: {
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
        },
        unitAssignments: true,
        progressDetails: true,
      },
    });

    // Transform response (simplified)
    const transformedProject = {
      id: project.id,
      propertyId: project.propertyId,
      propertyName: project.propertyName,
      propertyImageUrl: project.propertyImageUrl,
      propertyImageHint: project.propertyImageHint,
      status: project.status as 'active' | 'closed' | 'completed' | undefined,
      progress: {
        kyc: project.kycProgress,
        funding: project.fundingProgress,
        legal: project.legalProgress,
        closing: project.closingProgress,
      },
      members: project.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        avatarHint: m.user.avatarHint,
      })),
      unitAssignments: project.unitAssignments.map((ua) => ({
        unitId: ua.unitId,
        userId: ua.userId,
        price: Number(ua.price),
        size: ua.size ? Number(ua.size) : undefined,
      })),
    };

    return NextResponse.json({
      success: true,
      data: transformedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);

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
          message: 'Failed to update project',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Delete project (cascade will handle related data)
    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting project:', error);

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
          message: 'Failed to delete project',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








