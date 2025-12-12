import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProjectSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/projects - Get all projects dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { propertyName: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Get projects dengan pagination dan include relations
    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            include: {
              images: {
                orderBy: { order: 'asc' },
                take: 1, // Get first image only
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
            take: 10, // Get latest 10 messages
          },
          paymentPlans: {
            include: {
              payments: {
                orderBy: { createdAt: 'desc' },
                take: 5, // Get latest 5 payments
              },
            },
          },
        },
      }),
      db.project.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedProjects = projects.map((project) => {
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

      // Transform payment plans (installmentPlans)
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

      return {
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
    });

    return NextResponse.json({
      success: true,
      data: transformedProjects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch projects',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate basic project data
    const validatedData = createProjectSchema.parse(body);

    // Check if property exists
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Property not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    // Create project
    const project = await db.project.create({
      data: {
        propertyId: validatedData.propertyId,
        propertyName: validatedData.propertyName,
        propertyImageUrl: validatedData.propertyImageUrl,
        propertyImageHint: validatedData.propertyImageHint,
        status: validatedData.status || 'active',
        kycProgress: validatedData.kycProgress,
        fundingProgress: validatedData.fundingProgress,
        legalProgress: validatedData.legalProgress,
        closingProgress: validatedData.closingProgress,
      },
      include: {
        property: true,
        members: true,
        unitAssignments: true,
        progressDetails: true,
      },
    });

    // Transform response
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
        kyc: { title: 'KYC', percentage: 0, checklist: [], completedMembers: [] },
        funding: { title: 'Funding', percentage: 0, checklist: [], completedMembers: [] },
        legal: { title: 'Legal', percentage: 0, checklist: [], completedMembers: [] },
        closing: { title: 'Closing', percentage: 0, checklist: [], completedMembers: [] },
      },
      members: [],
      unitAssignments: [],
      documents: [],
      messages: [],
      installmentPlans: [],
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to create project',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






