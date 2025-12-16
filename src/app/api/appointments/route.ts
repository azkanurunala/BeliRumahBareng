import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAppointmentSchema, updateAppointmentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { createActivityLog } from '@/lib/actions/activity-log-actions';
import { requireAdmin } from '@/lib/auth-helpers';
import { getActorRole } from '@/lib/auth-utils';

// GET /api/appointments - Get appointments dengan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where: any = {};

    if (transactionId) where.transactionId = transactionId;
    if (type) where.type = type;
    if (status) where.status = status;

    // Get appointments
    const appointments = await db.appointment.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        transaction: {
          select: {
            id: true,
            projectId: true,
            userId: true,
            unitId: true,
            state: true,
          },
        },
      },
    });

    // Transform ke format yang diharapkan frontend
    const transformedAppointments = appointments.map((apt) => ({
      id: apt.id,
      transactionId: apt.transactionId,
      type: apt.type,
      scheduledDate: apt.scheduledDate.toISOString(),
      status: apt.status,
      location: apt.location,
      notes: apt.notes,
      completedAt: apt.completedAt?.toISOString(),
      createdAt: apt.createdAt.toISOString(),
      updatedAt: apt.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedAppointments,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch appointments',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createAppointmentSchema.parse(body);

    // Check if transaction exists
    const transaction = await db.purchaseTransaction.findUnique({
      where: { id: validatedData.transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Require admin access
    const user = await requireAdmin(request);

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        transactionId: validatedData.transactionId,
        type: validatedData.type,
        scheduledDate: new Date(validatedData.scheduledDate),
        status: 'scheduled',
        location: validatedData.location,
        notes: validatedData.notes,
      },
    });

    // Create activity log
    await createActivityLog({
      transactionId: validatedData.transactionId,
      action: 'appointment_scheduled',
      actorId: user.id,
      actorRole: getActorRole(user.role),
      details: JSON.stringify({ type: validatedData.type, scheduledDate: validatedData.scheduledDate }),
    });

    // Transform response
    const transformedAppointment = {
      id: appointment.id,
      transactionId: appointment.transactionId,
      type: appointment.type,
      scheduledDate: appointment.scheduledDate.toISOString(),
      status: appointment.status,
      location: appointment.location,
      notes: appointment.notes,
      completedAt: appointment.completedAt?.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedAppointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);

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
          message: 'Failed to create appointment',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments - Update appointment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = updateAppointmentSchema.parse(body);

    // Check if appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id: validatedData.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Require admin access
    const user = await requireAdmin(request);

    // Prepare update data
    const updateData: any = {};
    if (validatedData.scheduledDate) updateData.scheduledDate = new Date(validatedData.scheduledDate);
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.completedAt) updateData.completedAt = new Date(validatedData.completedAt);

    // Update appointment
    const updatedAppointment = await db.appointment.update({
      where: { id: validatedData.appointmentId },
      data: updateData,
    });

    // Create activity log
    const action = validatedData.status === 'completed' 
      ? 'appointment_completed' 
      : validatedData.status === 'cancelled'
      ? 'appointment_cancelled'
      : 'appointment_scheduled';

    await createActivityLog({
      transactionId: appointment.transactionId,
      action: action as any,
      actorId: user.id,
      actorRole: getActorRole(user.role),
      details: JSON.stringify({ appointmentId: validatedData.appointmentId, changes: updateData }),
    });

    // Transform response
    const transformedAppointment = {
      id: updatedAppointment.id,
      transactionId: updatedAppointment.transactionId,
      type: updatedAppointment.type,
      scheduledDate: updatedAppointment.scheduledDate.toISOString(),
      status: updatedAppointment.status,
      location: updatedAppointment.location,
      notes: updatedAppointment.notes,
      completedAt: updatedAppointment.completedAt?.toISOString(),
      createdAt: updatedAppointment.createdAt.toISOString(),
      updatedAt: updatedAppointment.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedAppointment,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);

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
          message: 'Failed to update appointment',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

