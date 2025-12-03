'use server';

import { db } from '@/lib/db';
import { createPaymentPlanSchema, updatePaymentPlanSchema, createPaymentSchema, updatePaymentSchema, verifyPaymentSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Payment Operations
 */

// Payment Plan Actions
export async function createPaymentPlan(data: z.infer<typeof createPaymentPlanSchema>) {
  try {
    // Validate input
    const validatedData = createPaymentPlanSchema.parse(data);

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

    // Create payment plan
    const paymentPlan = await db.paymentPlan.create({
      data: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
        type: validatedData.type,
        totalAmount: validatedData.totalAmount,
        downPayment: validatedData.downPayment,
        installmentAmount: validatedData.installmentAmount,
        totalInstallments: validatedData.totalInstallments,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: validatedData.status,
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: true,
      },
    });

    // Transform response
    const transformedPlan = {
      id: paymentPlan.id,
      projectId: paymentPlan.projectId,
      userId: paymentPlan.userId,
      unitId: paymentPlan.unitId,
      totalAmount: Number(paymentPlan.totalAmount),
      downPayment: paymentPlan.downPayment ? Number(paymentPlan.downPayment) : undefined,
      installmentAmount: paymentPlan.installmentAmount ? Number(paymentPlan.installmentAmount) : undefined,
      totalInstallments: paymentPlan.totalInstallments,
      startDate: paymentPlan.startDate?.toISOString(),
      endDate: paymentPlan.endDate?.toISOString(),
      status: paymentPlan.status,
      type: paymentPlan.type,
      payments: [],
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath('/api/payment-plans');

    return {
      success: true,
      data: transformedPlan,
    };
  } catch (error) {
    console.error('Error creating payment plan:', error);

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
        message: 'Failed to create payment plan',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updatePaymentPlan(
  id: string,
  data: Partial<z.infer<typeof updatePaymentPlanSchema>>
) {
  try {
    // Check if payment plan exists
    const existingPlan = await db.paymentPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return {
        success: false,
        error: {
          message: 'Payment plan not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updatePaymentPlanSchema.parse({ ...data, id });

    // Update payment plan
    const updateData: any = {};
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.totalAmount !== undefined) updateData.totalAmount = validatedData.totalAmount;
    if (validatedData.downPayment !== undefined) updateData.downPayment = validatedData.downPayment;
    if (validatedData.installmentAmount !== undefined) updateData.installmentAmount = validatedData.installmentAmount;
    if (validatedData.totalInstallments !== undefined) updateData.totalInstallments = validatedData.totalInstallments;
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    const paymentPlan = await db.paymentPlan.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Transform response
    const transformedPlan = {
      id: paymentPlan.id,
      projectId: paymentPlan.projectId,
      userId: paymentPlan.userId,
      unitId: paymentPlan.unitId,
      totalAmount: Number(paymentPlan.totalAmount),
      downPayment: paymentPlan.downPayment ? Number(paymentPlan.downPayment) : undefined,
      installmentAmount: paymentPlan.installmentAmount ? Number(paymentPlan.installmentAmount) : undefined,
      totalInstallments: paymentPlan.totalInstallments,
      startDate: paymentPlan.startDate?.toISOString(),
      endDate: paymentPlan.endDate?.toISOString(),
      status: paymentPlan.status,
      type: paymentPlan.type,
      payments: paymentPlan.payments.map((p) => ({
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
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${paymentPlan.projectId}`);
    revalidatePath('/api/payment-plans');

    return {
      success: true,
      data: transformedPlan,
    };
  } catch (error) {
    console.error('Error updating payment plan:', error);

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
        message: 'Failed to update payment plan',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deletePaymentPlan(id: string) {
  try {
    // Check if payment plan exists
    const paymentPlan = await db.paymentPlan.findUnique({
      where: { id },
    });

    if (!paymentPlan) {
      return {
        success: false,
        error: {
          message: 'Payment plan not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete payment plan
    await db.paymentPlan.delete({
      where: { id },
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${paymentPlan.projectId}`);
    revalidatePath('/api/payment-plans');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting payment plan:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete payment plan',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getPaymentPlan(id: string) {
  try {
    const paymentPlan = await db.paymentPlan.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!paymentPlan) {
      return {
        success: false,
        error: {
          message: 'Payment plan not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform response
    const transformedPlan = {
      id: paymentPlan.id,
      projectId: paymentPlan.projectId,
      userId: paymentPlan.userId,
      unitId: paymentPlan.unitId,
      totalAmount: Number(paymentPlan.totalAmount),
      downPayment: paymentPlan.downPayment ? Number(paymentPlan.downPayment) : undefined,
      installmentAmount: paymentPlan.installmentAmount ? Number(paymentPlan.installmentAmount) : undefined,
      totalInstallments: paymentPlan.totalInstallments,
      startDate: paymentPlan.startDate?.toISOString(),
      endDate: paymentPlan.endDate?.toISOString(),
      status: paymentPlan.status,
      type: paymentPlan.type,
      payments: paymentPlan.payments.map((p) => ({
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
    };

    return {
      success: true,
      data: transformedPlan,
    };
  } catch (error) {
    console.error('Error fetching payment plan:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch payment plan',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getPaymentPlans(options?: {
  page?: number;
  limit?: number;
  projectId?: string;
  userId?: string;
  type?: string;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.userId) where.userId = options.userId;
    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;

    // Get payment plans dengan pagination
    const [paymentPlans, total] = await Promise.all([
      db.paymentPlan.findMany({
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.paymentPlan.count({ where }),
    ]);

    // Transform response
    const transformedPlans = paymentPlans.map((plan) => ({
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
      type: plan.type,
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
      success: true,
      data: transformedPlans,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching payment plans:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch payment plans',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Payment Actions
export async function createPayment(data: z.infer<typeof createPaymentSchema>) {
  try {
    // Validate input
    const validatedData = createPaymentSchema.parse(data);

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

    // Check if payment plan exists (if provided)
    if (validatedData.paymentPlanId) {
      const paymentPlan = await db.paymentPlan.findUnique({
        where: { id: validatedData.paymentPlanId },
      });

      if (!paymentPlan) {
        return {
          success: false,
          error: {
            message: 'Payment plan not found',
            code: 'NOT_FOUND',
          },
        };
      }
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        paymentPlanId: validatedData.paymentPlanId || null,
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        period: validatedData.period || null,
        status: validatedData.status,
        paymentMethod: validatedData.paymentMethod || null,
        receiptUrl: validatedData.receiptUrl || null,
        paymentReference: validatedData.paymentReference || null,
        notes: validatedData.notes || null,
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    // Transform response
    const transformedPayment = {
      id: payment.id,
      paymentPlanId: payment.paymentPlanId,
      projectId: payment.projectId,
      userId: payment.userId,
      unitId: payment.unitId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate?.toISOString(),
      period: payment.period,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      receiptUrl: payment.receiptUrl,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath('/admin/payments');
    revalidatePath('/api/payments');

    return {
      success: true,
      data: transformedPayment,
    };
  } catch (error) {
    console.error('Error creating payment:', error);

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
        message: 'Failed to create payment',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updatePayment(
  id: string,
  data: Partial<z.infer<typeof updatePaymentSchema>>
) {
  try {
    // Check if payment exists
    const existingPayment = await db.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return {
        success: false,
        error: {
          message: 'Payment not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updatePaymentSchema.parse({ ...data, id });

    // Update payment
    const updateData: any = {};
    if (validatedData.paymentPlanId !== undefined) updateData.paymentPlanId = validatedData.paymentPlanId || null;
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.paymentDate !== undefined) updateData.paymentDate = validatedData.paymentDate ? new Date(validatedData.paymentDate) : null;
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    if (validatedData.period !== undefined) updateData.period = validatedData.period || null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.paymentMethod !== undefined) updateData.paymentMethod = validatedData.paymentMethod || null;
    if (validatedData.receiptUrl !== undefined) updateData.receiptUrl = validatedData.receiptUrl || null;
    if (validatedData.paymentReference !== undefined) updateData.paymentReference = validatedData.paymentReference || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    // Transform response
    const transformedPayment = {
      id: payment.id,
      paymentPlanId: payment.paymentPlanId,
      projectId: payment.projectId,
      userId: payment.userId,
      unitId: payment.unitId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate?.toISOString(),
      period: payment.period,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      receiptUrl: payment.receiptUrl,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${payment.projectId}`);
    revalidatePath('/admin/payments');
    revalidatePath('/api/payments');

    return {
      success: true,
      data: transformedPayment,
    };
  } catch (error) {
    console.error('Error updating payment:', error);

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
        message: 'Failed to update payment',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deletePayment(id: string) {
  try {
    // Check if payment exists
    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return {
        success: false,
        error: {
          message: 'Payment not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete payment
    await db.payment.delete({
      where: { id },
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${payment.projectId}`);
    revalidatePath('/admin/payments');
    revalidatePath('/api/payments');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting payment:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete payment',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getPayment(id: string) {
  try {
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
            totalAmount: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return {
        success: false,
        error: {
          message: 'Payment not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform response
    const transformedPayment = {
      id: payment.id,
      paymentPlanId: payment.paymentPlanId,
      projectId: payment.projectId,
      userId: payment.userId,
      unitId: payment.unitId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate?.toISOString(),
      period: payment.period,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      receiptUrl: payment.receiptUrl,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    };

    return {
      success: true,
      data: transformedPayment,
    };
  } catch (error) {
    console.error('Error fetching payment:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch payment',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getPayments(options?: {
  page?: number;
  limit?: number;
  projectId?: string;
  userId?: string;
  paymentPlanId?: string;
  status?: string;
  period?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.userId) where.userId = options.userId;
    if (options?.paymentPlanId) where.paymentPlanId = options.paymentPlanId;
    if (options?.status) where.status = options.status;
    if (options?.period) where.period = options.period;

    // Get payments dengan pagination
    const [payments, total] = await Promise.all([
      db.payment.findMany({
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              avatarHint: true,
            },
          },
          paymentPlan: {
            select: {
              id: true,
              type: true,
            },
          },
          verifier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    // Transform response
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      paymentPlanId: payment.paymentPlanId,
      projectId: payment.projectId,
      userId: payment.userId,
      unitId: payment.unitId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate?.toISOString(),
      period: payment.period,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      receiptUrl: payment.receiptUrl,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: transformedPayments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching payments:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch payments',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Payment Verification
export async function verifyPayment(data: z.infer<typeof verifyPaymentSchema>) {
  try {
    // Validate input
    const validatedData = verifyPaymentSchema.parse(data);

    // Check if payment exists
    const payment = await db.payment.findUnique({
      where: { id: validatedData.paymentId },
    });

    if (!payment) {
      return {
        success: false,
        error: {
          message: 'Payment not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if verifier exists
    const verifier = await db.user.findUnique({
      where: { id: validatedData.verifiedBy },
    });

    if (!verifier) {
      return {
        success: false,
        error: {
          message: 'Verifier not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Update payment dengan verification
    const updatedPayment = await db.payment.update({
      where: { id: validatedData.paymentId },
      data: {
        status: 'paid',
        verifiedBy: validatedData.verifiedBy,
        verifiedAt: new Date(),
        notes: validatedData.notes || payment.notes,
        paymentDate: payment.paymentDate || new Date(),
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedPayment = {
      id: updatedPayment.id,
      paymentPlanId: updatedPayment.paymentPlanId,
      projectId: updatedPayment.projectId,
      userId: updatedPayment.userId,
      unitId: updatedPayment.unitId,
      amount: Number(updatedPayment.amount),
      paymentDate: updatedPayment.paymentDate?.toISOString(),
      dueDate: updatedPayment.dueDate?.toISOString(),
      period: updatedPayment.period,
      status: updatedPayment.status,
      paymentMethod: updatedPayment.paymentMethod,
      receiptUrl: updatedPayment.receiptUrl,
      paymentReference: updatedPayment.paymentReference,
      notes: updatedPayment.notes,
      verifiedBy: updatedPayment.verifiedBy,
      verifiedAt: updatedPayment.verifiedAt?.toISOString(),
      createdAt: updatedPayment.createdAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${updatedPayment.projectId}`);
    revalidatePath('/admin/payments');
    revalidatePath('/api/payments');

    return {
      success: true,
      data: transformedPayment,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);

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
        message: 'Failed to verify payment',
        code: 'VERIFY_ERROR',
      },
    };
  }
}

