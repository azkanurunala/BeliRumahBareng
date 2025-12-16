import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updatePropertySchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/properties/[id] - Get property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await db.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Transform ke format yang diharapkan frontend
    const transformedProperty = {
      id: property.id,
      name: property.name,
      description: property.description,
      price: Number(property.price),
      totalArea: property.totalArea ? Number(property.totalArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      images: property.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      planningInfo: property.sitePlanUrl
        ? {
            sitePlanUrl: property.sitePlanUrl,
            sitePlanHint: property.sitePlanHint || '',
            developmentPlan: property.developmentPlan || '',
            environmentalAnalysis: property.environmentalAnalysis || '',
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedProperty,
    });
  } catch (error) {
    console.error('Error fetching property:', error);

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
          message: 'Failed to fetch property',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if property exists
    const existingProperty = await db.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw new NotFoundError('Property not found');
    }

    // Validate input dengan ID
    const validatedData = updatePropertySchema.parse({ ...body, id });

    // Update property
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.totalArea !== undefined) updateData.totalArea = validatedData.totalArea;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.totalUnits !== undefined) updateData.totalUnits = validatedData.totalUnits;
    if (validatedData.unitName !== undefined) updateData.unitName = validatedData.unitName;
    if (validatedData.unitSize !== undefined) updateData.unitSize = validatedData.unitSize;
    if (validatedData.unitMeasure !== undefined) updateData.unitMeasure = validatedData.unitMeasure;
    if (validatedData.sitePlanUrl !== undefined) updateData.sitePlanUrl = validatedData.sitePlanUrl || null;
    if (validatedData.sitePlanHint !== undefined) updateData.sitePlanHint = validatedData.sitePlanHint || null;
    if (validatedData.developmentPlan !== undefined) updateData.developmentPlan = validatedData.developmentPlan || null;
    if (validatedData.environmentalAnalysis !== undefined) updateData.environmentalAnalysis = validatedData.environmentalAnalysis || null;

    // Handle images update
    if (validatedData.images !== undefined) {
      // Delete existing images
      await db.propertyImage.deleteMany({
        where: { propertyId: id },
      });

      // Create new images
      updateData.images = {
        create: validatedData.images.map((img, index) => ({
          url: img.url,
          hint: img.hint,
          order: img.order ?? index,
        })),
      };
    }

    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Transform ke format yang diharapkan frontend
    const transformedProperty = {
      id: property.id,
      name: property.name,
      description: property.description,
      price: Number(property.price),
      totalArea: property.totalArea ? Number(property.totalArea) : undefined,
      location: property.location,
      type: property.type as 'co-building' | 'co-owning',
      totalUnits: property.totalUnits,
      unitName: property.unitName as 'Lantai' | 'Kavling' | 'Kepemilikan',
      unitSize: property.unitSize ? Number(property.unitSize) : undefined,
      unitMeasure: property.unitMeasure,
      images: property.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      planningInfo: property.sitePlanUrl
        ? {
            sitePlanUrl: property.sitePlanUrl,
            sitePlanHint: property.sitePlanHint || '',
            developmentPlan: property.developmentPlan || '',
            environmentalAnalysis: property.environmentalAnalysis || '',
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedProperty,
    });
  } catch (error) {
    console.error('Error updating property:', error);

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
          message: 'Failed to update property',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if property exists
    const property = await db.property.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check if property is used in any project
    if (property.projects.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Cannot delete property: property is used in one or more projects',
            code: 'CONFLICT',
          },
        },
        { status: 409 }
      );
    }

    // Delete property (images will be deleted automatically due to cascade)
    await db.property.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting property:', error);

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
          message: 'Failed to delete property',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








