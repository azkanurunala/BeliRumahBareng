'use server';

import { db } from '@/lib/db';
import { createPropertySubmissionSchema, updatePropertySubmissionSchema, reviewPropertySubmissionSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotificationForAdmin, createNotificationForUser } from '@/lib/notifications';

/**
 * Server Actions untuk Property Submission Operations
 */

export async function createPropertySubmission(data: z.infer<typeof createPropertySubmissionSchema>) {
  try {
    const validatedData = createPropertySubmissionSchema.parse(data);
    
    // Handle guest submissions - create or find guest user
    let submitterId = validatedData.submittedBy;
    if (submitterId === 'guest') {
      // Find or create guest user
      let guestUser = await db.user.findUnique({ where: { email: 'guest@belirumahbareng.com' } });
      if (!guestUser) {
        guestUser = await db.user.create({
          data: {
            name: 'Guest User',
            email: 'guest@belirumahbareng.com',
            phoneNumber: '0000000000',
            avatarUrl: '',
            avatarHint: '',
            locationPreference: '',
            priceRange: '',
            investmentGoals: '',
            financialCapacity: '',
            timeHorizon: '',
          },
        });
      }
      submitterId = guestUser.id;
    } else {
      const submitter = await db.user.findUnique({ where: { id: validatedData.submittedBy } });
      if (!submitter) {
        return { success: false, error: { message: 'Submitter not found', code: 'NOT_FOUND' } };
      }
    }

    const submission = await db.propertySubmission.create({
      data: {
        submittedBy: submitterId,
        type: validatedData.type,
        name: validatedData.name,
        description: validatedData.description,
        location: validatedData.location,
        totalArea: validatedData.totalArea,
        totalUnits: validatedData.totalUnits,
        unitSize: validatedData.unitSize,
        unitMeasure: validatedData.unitMeasure,
        askingPrice: validatedData.askingPrice,
        contactPerson: validatedData.contactPerson,
        contactPhone: validatedData.contactPhone,
        contactEmail: validatedData.contactEmail,
        status: 'pending',
        images: {
          create: validatedData.images?.map((img, index) => ({
            url: img.url,
            hint: img.hint,
            order: img.order ?? index,
          })) || [],
        },
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    const transformed = {
      id: submission.id,
      submittedBy: submission.submittedBy,
      type: submission.type as 'co-building' | 'co-owning',
      name: submission.name,
      description: submission.description,
      location: submission.location,
      totalArea: submission.totalArea ? Number(submission.totalArea) : undefined,
      totalUnits: submission.totalUnits,
      unitSize: submission.unitSize ? Number(submission.unitSize) : undefined,
      unitMeasure: submission.unitMeasure,
      askingPrice: Number(submission.askingPrice),
      contactPerson: submission.contactPerson,
      contactPhone: submission.contactPhone,
      contactEmail: submission.contactEmail,
      images: submission.images.map((img) => ({ url: img.url, hint: img.hint })),
      status: submission.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: submission.reviewedBy,
      reviewedAt: submission.reviewedAt?.toISOString(),
      notes: submission.notes,
      createdAt: submission.createdAt.toISOString(),
    };

    revalidatePath('/admin/property-submissions');
    revalidatePath('/api/property-submissions');
    
    // Create notification untuk admin
    if (submitter) {
      await createNotificationForAdmin(
        'Pengajuan Properti Baru',
        `Pengajuan properti baru: ${submission.name} dari ${submitter.name}`,
        'property_submission_new',
        `/admin/property-submissions`
      );
    } else {
      await createNotificationForAdmin(
        'Pengajuan Properti Baru',
        `Pengajuan properti baru: ${submission.name} dari Guest User`,
        'property_submission_new',
        `/admin/property-submissions`
      );
    }
    
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error creating property submission:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to create property submission', code: 'CREATE_ERROR' } };
  }
}

export async function updatePropertySubmission(id: string, data: Partial<z.infer<typeof updatePropertySubmissionSchema>>) {
  try {
    const existing = await db.propertySubmission.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: { message: 'Property submission not found', code: 'NOT_FOUND' } };
    }

    const validatedData = updatePropertySubmissionSchema.parse({ ...data, id });
    const updateData: any = {};
    if (validatedData.submittedBy !== undefined) updateData.submittedBy = validatedData.submittedBy;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.totalArea !== undefined) updateData.totalArea = validatedData.totalArea;
    if (validatedData.totalUnits !== undefined) updateData.totalUnits = validatedData.totalUnits;
    if (validatedData.unitSize !== undefined) updateData.unitSize = validatedData.unitSize;
    if (validatedData.unitMeasure !== undefined) updateData.unitMeasure = validatedData.unitMeasure;
    if (validatedData.askingPrice !== undefined) updateData.askingPrice = validatedData.askingPrice;
    if (validatedData.contactPerson !== undefined) updateData.contactPerson = validatedData.contactPerson;
    if (validatedData.contactPhone !== undefined) updateData.contactPhone = validatedData.contactPhone;
    if (validatedData.contactEmail !== undefined) updateData.contactEmail = validatedData.contactEmail;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    if (validatedData.images !== undefined) {
      await db.propertySubmissionImage.deleteMany({ where: { propertySubmissionId: id } });
      updateData.images = {
        create: validatedData.images.map((img, index) => ({
          url: img.url,
          hint: img.hint,
          order: img.order ?? index,
        })),
      };
    }

    const submission = await db.propertySubmission.update({
      where: { id },
      data: updateData,
      include: { images: { orderBy: { order: 'asc' } } },
    });

    const transformed = {
      id: submission.id,
      submittedBy: submission.submittedBy,
      type: submission.type as 'co-building' | 'co-owning',
      name: submission.name,
      description: submission.description,
      location: submission.location,
      totalArea: submission.totalArea ? Number(submission.totalArea) : undefined,
      totalUnits: submission.totalUnits,
      unitSize: submission.unitSize ? Number(submission.unitSize) : undefined,
      unitMeasure: submission.unitMeasure,
      askingPrice: Number(submission.askingPrice),
      contactPerson: submission.contactPerson,
      contactPhone: submission.contactPhone,
      contactEmail: submission.contactEmail,
      images: submission.images.map((img) => ({ url: img.url, hint: img.hint })),
      status: submission.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: submission.reviewedBy,
      reviewedAt: submission.reviewedAt?.toISOString(),
      notes: submission.notes,
      createdAt: submission.createdAt.toISOString(),
    };

    revalidatePath('/admin/property-submissions');
    revalidatePath(`/admin/property-submissions/${id}`);
    revalidatePath('/api/property-submissions');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error updating property submission:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to update property submission', code: 'UPDATE_ERROR' } };
  }
}

export async function deletePropertySubmission(id: string) {
  try {
    const submission = await db.propertySubmission.findUnique({ where: { id } });
    if (!submission) {
      return { success: false, error: { message: 'Property submission not found', code: 'NOT_FOUND' } };
    }
    await db.propertySubmission.delete({ where: { id } });
    revalidatePath('/admin/property-submissions');
    revalidatePath('/api/property-submissions');
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting property submission:', error);
    return { success: false, error: { message: 'Failed to delete property submission', code: 'DELETE_ERROR' } };
  }
}

export async function getPropertySubmission(id: string) {
  try {
    const submission = await db.propertySubmission.findUnique({
      where: { id },
      include: {
        submitter: { select: { id: true, name: true, email: true, phoneNumber: true, avatarUrl: true, avatarHint: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!submission) {
      return { success: false, error: { message: 'Property submission not found', code: 'NOT_FOUND' } };
    }
    const transformed = {
      id: submission.id,
      submittedBy: submission.submittedBy,
      type: submission.type as 'co-building' | 'co-owning',
      name: submission.name,
      description: submission.description,
      location: submission.location,
      totalArea: submission.totalArea ? Number(submission.totalArea) : undefined,
      totalUnits: submission.totalUnits,
      unitSize: submission.unitSize ? Number(submission.unitSize) : undefined,
      unitMeasure: submission.unitMeasure,
      askingPrice: Number(submission.askingPrice),
      contactPerson: submission.contactPerson,
      contactPhone: submission.contactPhone,
      contactEmail: submission.contactEmail,
      images: submission.images.map((img) => ({ url: img.url, hint: img.hint })),
      status: submission.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: submission.reviewedBy,
      reviewedAt: submission.reviewedAt?.toISOString(),
      notes: submission.notes,
      createdAt: submission.createdAt.toISOString(),
    };
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error fetching property submission:', error);
    return { success: false, error: { message: 'Failed to fetch property submission', code: 'FETCH_ERROR' } };
  }
}

export async function getPropertySubmissions(options?: { page?: number; limit?: number; submittedBy?: string; status?: string; type?: string }) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (options?.submittedBy) where.submittedBy = options.submittedBy;
    if (options?.status) where.status = options.status;
    if (options?.type) where.type = options.type;

    const [submissions, total] = await Promise.all([
      db.propertySubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: { select: { id: true, name: true, email: true, phoneNumber: true, avatarUrl: true, avatarHint: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          images: { orderBy: { order: 'asc' } },
        },
      }),
      db.propertySubmission.count({ where }),
    ]);

    const transformed = submissions.map((s) => ({
      id: s.id,
      submittedBy: s.submittedBy,
      type: s.type as 'co-building' | 'co-owning',
      name: s.name,
      description: s.description,
      location: s.location,
      totalArea: s.totalArea ? Number(s.totalArea) : undefined,
      totalUnits: s.totalUnits,
      unitSize: s.unitSize ? Number(s.unitSize) : undefined,
      unitMeasure: s.unitMeasure,
      askingPrice: Number(s.askingPrice),
      contactPerson: s.contactPerson,
      contactPhone: s.contactPhone,
      contactEmail: s.contactEmail,
      images: s.images.map((img) => ({ url: img.url, hint: img.hint })),
      status: s.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: s.reviewedBy,
      reviewedAt: s.reviewedAt?.toISOString(),
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    }));

    return { success: true, data: transformed, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  } catch (error) {
    console.error('Error fetching property submissions:', error);
    return { success: false, error: { message: 'Failed to fetch property submissions', code: 'FETCH_ERROR' } };
  }
}

export async function reviewPropertySubmission(data: z.infer<typeof reviewPropertySubmissionSchema>) {
  try {
    const validatedData = reviewPropertySubmissionSchema.parse(data);
    const submission = await db.propertySubmission.findUnique({ where: { id: validatedData.id } });
    if (!submission) {
      return { success: false, error: { message: 'Property submission not found', code: 'NOT_FOUND' } };
    }
    const reviewer = await db.user.findUnique({ where: { id: validatedData.reviewedBy } });
    if (!reviewer) {
      return { success: false, error: { message: 'Reviewer not found', code: 'NOT_FOUND' } };
    }

    const updated = await db.propertySubmission.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        reviewedBy: validatedData.reviewedBy,
        notes: validatedData.notes || submission.notes,
        reviewedAt: new Date(),
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    const transformed = {
      id: updated.id,
      submittedBy: updated.submittedBy,
      type: updated.type as 'co-building' | 'co-owning',
      name: updated.name,
      description: updated.description,
      location: updated.location,
      totalArea: updated.totalArea ? Number(updated.totalArea) : undefined,
      totalUnits: updated.totalUnits,
      unitSize: updated.unitSize ? Number(updated.unitSize) : undefined,
      unitMeasure: updated.unitMeasure,
      askingPrice: Number(updated.askingPrice),
      contactPerson: updated.contactPerson,
      contactPhone: updated.contactPhone,
      contactEmail: updated.contactEmail,
      images: updated.images.map((img) => ({ url: img.url, hint: img.hint })),
      status: updated.status as 'pending' | 'approved' | 'rejected' | 'contacted',
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt?.toISOString(),
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    };

    revalidatePath('/admin/property-submissions');
    revalidatePath(`/admin/property-submissions/${validatedData.id}`);
    revalidatePath('/api/property-submissions');
    
    // Create notification untuk user yang submit
    const notificationType = validatedData.status === 'approved' 
      ? 'property_submission_approved' 
      : validatedData.status === 'rejected'
      ? 'property_submission_rejected'
      : validatedData.status === 'contacted'
      ? 'property_submission_contacted'
      : null;
    
    if (notificationType) {
      const notificationTitle = validatedData.status === 'approved'
        ? 'Pengajuan Properti Disetujui'
        : validatedData.status === 'rejected'
        ? 'Pengajuan Properti Ditolak'
        : 'Pengajuan Properti Sudah Dihubungi';
      
      const notificationDesc = validatedData.status === 'approved'
        ? `Pengajuan properti "${updated.name}" telah disetujui oleh admin.`
        : validatedData.status === 'rejected'
        ? `Pengajuan properti "${updated.name}" telah ditolak.${validatedData.notes ? ` Catatan: ${validatedData.notes}` : ''}`
        : `Pengajuan properti "${updated.name}" telah dihubungi oleh tim BeliRumahBareng.${validatedData.notes ? ` Catatan: ${validatedData.notes}` : ''}`;
      
      await createNotificationForUser(
        submission.submittedBy,
        notificationTitle,
        notificationDesc,
        notificationType,
        validatedData.status === 'approved' ? `/property/${updated.id}` : null
      );
    }
    
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error reviewing property submission:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to review property submission', code: 'REVIEW_ERROR' } };
  }
}



