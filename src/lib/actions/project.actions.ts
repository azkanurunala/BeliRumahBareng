'use server';

import { db } from '@/lib/db';
import { createProjectSchema, updateProjectSchema, projectMemberSchema, unitAssignmentSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Project Operations
 */

export async function createProject(data: z.infer<typeof createProjectSchema>) {
  try {
    // Validate input
    const validatedData = createProjectSchema.parse(data);

    // Check if property exists
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      return {
        success: false,
        error: {
          message: 'Property not found',
          code: 'NOT_FOUND',
        },
      };
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

    revalidatePath('/admin/projects');
    revalidatePath('/api/projects');

    return {
      success: true,
      data: transformedProject,
    };
  } catch (error) {
    console.error('Error creating project:', error);

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
        message: 'Failed to create project',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updateProject(
  id: string,
  data: Partial<z.infer<typeof updateProjectSchema>>
) {
  try {
    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return {
        success: false,
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updateProjectSchema.parse({ ...data, id });

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

    // Transform response (simplified - full transform should be done in GET)
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

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${id}`);
    revalidatePath('/api/projects');

    return {
      success: true,
      data: transformedProject,
    };
  } catch (error) {
    console.error('Error updating project:', error);

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
        message: 'Failed to update project',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deleteProject(id: string) {
  try {
    // Check if project exists
    const project = await db.project.findUnique({
      where: { id },
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

    // Delete project (cascade will handle related data)
    await db.project.delete({
      where: { id },
    });

    revalidatePath('/admin/projects');
    revalidatePath('/api/projects');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting project:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete project',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getProject(id: string) {
  try {
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
      return {
        success: false,
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND',
        },
      };
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

    return {
      success: true,
      data: transformedProject,
    };
  } catch (error) {
    console.error('Error fetching project:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch project',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getProjects(options?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const search = options?.search || '';
    const status = options?.status || '';
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

    // Get projects dengan pagination (simplified include untuk performance)
    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
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
          },
          unitAssignments: true,
        },
      }),
      db.project.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend (simplified)
    const transformedProjects = projects.map((project) => ({
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
        avatarHint: '',
        profile: {
          locationPreference: '',
          priceRange: '',
          investmentGoals: '',
          financialCapacity: '',
          timeHorizon: '',
        },
      })),
      unitAssignments: project.unitAssignments.map((ua) => ({
        unitId: ua.unitId,
        userId: ua.userId,
        price: Number(ua.price),
        size: ua.size ? Number(ua.size) : undefined,
      })),
      progressDetails: {
        kyc: { title: 'KYC', percentage: 0, checklist: [], completedMembers: [] },
        funding: { title: 'Funding', percentage: 0, checklist: [], completedMembers: [] },
        legal: { title: 'Legal', percentage: 0, checklist: [], completedMembers: [] },
        closing: { title: 'Closing', percentage: 0, checklist: [], completedMembers: [] },
      },
      documents: [],
      messages: [],
      installmentPlans: [],
    }));

    return {
      success: true,
      data: transformedProjects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching projects:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch projects',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Helper functions untuk Project Members
export async function addProjectMember(data: z.infer<typeof projectMemberSchema>) {
  try {
    const validatedData = projectMemberSchema.parse(data);

    // Check if member already exists
    const existing = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: validatedData.projectId,
          userId: validatedData.userId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          message: 'User is already a member of this project',
          code: 'CONFLICT',
        },
      };
    }

    const member = await db.projectMember.create({
      data: validatedData,
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
    });

    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath('/api/projects');

    return {
      success: true,
      data: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
        avatarHint: member.user.avatarHint,
      },
    };
  } catch (error) {
    console.error('Error adding project member:', error);

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
        message: 'Failed to add project member',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function removeProjectMember(projectId: string, userId: string) {
  try {
    await db.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath('/api/projects');

    return {
      success: true,
      data: { projectId, userId },
    };
  } catch (error) {
    console.error('Error removing project member:', error);

    return {
      success: false,
      error: {
        message: 'Failed to remove project member',
        code: 'DELETE_ERROR',
      },
    };
  }
}

// Helper functions untuk Unit Assignments
export async function addUnitAssignment(data: z.infer<typeof unitAssignmentSchema>) {
  try {
    const validatedData = unitAssignmentSchema.parse(data);

    // Check if unit already assigned
    const existing = await db.unitAssignment.findUnique({
      where: {
        projectId_unitId: {
          projectId: validatedData.projectId,
          unitId: validatedData.unitId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          message: 'Unit is already assigned',
          code: 'CONFLICT',
        },
      };
    }

    const assignment = await db.unitAssignment.create({
      data: {
        projectId: validatedData.projectId,
        unitId: validatedData.unitId,
        userId: validatedData.userId,
        price: validatedData.price,
        size: validatedData.size,
      },
    });

    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath('/api/projects');

    return {
      success: true,
      data: {
        unitId: assignment.unitId,
        userId: assignment.userId,
        price: Number(assignment.price),
        size: assignment.size ? Number(assignment.size) : undefined,
      },
    };
  } catch (error) {
    console.error('Error adding unit assignment:', error);

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
        message: 'Failed to add unit assignment',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function removeUnitAssignment(projectId: string, unitId: number) {
  try {
    await db.unitAssignment.delete({
      where: {
        projectId_unitId: {
          projectId,
          unitId,
        },
      },
    });

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath('/api/projects');

    return {
      success: true,
      data: { projectId, unitId },
    };
  } catch (error) {
    console.error('Error removing unit assignment:', error);

    return {
      success: false,
      error: {
        message: 'Failed to remove unit assignment',
        code: 'DELETE_ERROR',
      },
    };
  }
}

